use std::sync::Arc;

use axum::extract::{FromRequest, Request, State};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::{Json, Router};
use rust_decimal::Decimal;
use uuid::Uuid;

use crate::error::AppError;
use crate::AppState;

/// Verified Stripe webhook event.
///
/// The [`FromRequest`] implementation reads the raw body and
/// `Stripe-Signature` header, then calls
/// [`stripe::Webhook::construct_event`] to verify the HMAC-SHA256
/// signature **before** the handler touches any state (INV-1).
pub struct StripeEvent(pub stripe::Event);

impl FromRequest<Arc<AppState>> for StripeEvent {
    type Rejection = Response;

    async fn from_request(req: Request, state: &Arc<AppState>) -> Result<Self, Self::Rejection> {
        let sig = req
            .headers()
            .get("Stripe-Signature")
            .and_then(|v| v.to_str().ok())
            .map(String::from);

        let sig = sig.ok_or_else(|| {
            (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": "Missing Stripe-Signature header" })),
            )
                .into_response()
        })?;

        let payload = String::from_request(req, state)
            .await
            .map_err(|e| e.into_response())?;

        let event = stripe::Webhook::construct_event(
            &payload,
            &sig,
            &state.config.stripe_webhook_secret,
        )
        .map_err(|e| {
            tracing::warn!(error = %e, "Stripe webhook signature verification failed");
            (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": "Invalid webhook signature" })),
            )
                .into_response()
        })?;

        Ok(StripeEvent(event))
    }
}

/// Handle incoming Stripe webhook events.
///
/// The [`StripeEvent`] extractor guarantees the signature is valid
/// before this function runs (INV-1).
///
/// Returns 200 for all acknowledged events (including unhandled types).
/// Returns 500 only on DB errors so Stripe retries delivery.
pub async fn handle_stripe_webhook(
    State(state): State<Arc<AppState>>,
    StripeEvent(event): StripeEvent,
) -> Result<impl IntoResponse, AppError> {
    tracing::info!(
        event_type = ?event.type_,
        event_id = %event.id,
        "Stripe webhook received"
    );

    match event.type_ {
        stripe::EventType::CheckoutSessionCompleted => {
            handle_checkout_completed(&state, event.data.object).await?;
        }
        stripe::EventType::PaymentIntentSucceeded => {
            handle_payment_intent_succeeded(&state, event.data.object).await?;
        }
        stripe::EventType::ChargeRefunded => {
            handle_charge_refunded(&state, event.data.object).await?;
        }
        stripe::EventType::AccountUpdated => {
            handle_account_updated(&state, event.data.object).await?;
        }
        other => {
            tracing::debug!(event_type = ?other, "Unhandled event type, acknowledging");
        }
    }

    Ok((StatusCode::OK, Json(serde_json::json!({ "received": true }))))
}

/// Process `checkout.session.completed`: extract booking_id from metadata,
/// verify idempotency, and INSERT one row into `transactions`.
///
/// Graceful returns (200, no INSERT):
/// - Missing/invalid `booking_id` in metadata (EC-1)
/// - Duplicate `stripe_payment_intent_id` already recorded (EC-2, INV-3)
/// - Booking not found in DB
/// - FK violation (booking deleted between validation and INSERT — ERR-3)
///
/// 500 (triggers Stripe retry): any other DB error.
async fn handle_checkout_completed(
    state: &AppState,
    object: stripe::EventObject,
) -> Result<(), AppError> {
    let session = match object {
        stripe::EventObject::CheckoutSession(s) => s,
        _ => {
            tracing::warn!("checkout.session.completed: unexpected event object type");
            return Ok(());
        }
    };

    let booking_id = session
        .metadata
        .as_ref()
        .and_then(|m| m.get("booking_id"))
        .and_then(|v| Uuid::parse_str(v).ok());

    let booking_id = match booking_id {
        Some(id) => id,
        None => {
            tracing::warn!(
                session_id = %session.id,
                "checkout.session.completed: missing or invalid booking_id in metadata"
            );
            return Ok(());
        }
    };

    let pi_id = match &session.payment_intent {
        Some(pi) => match pi {
            stripe::Expandable::Id(id) => id.to_string(),
            stripe::Expandable::Object(obj) => obj.id.to_string(),
        },
        None => {
            tracing::warn!(
                session_id = %session.id,
                "checkout.session.completed: no payment_intent on session"
            );
            return Ok(());
        }
    };

    let already_exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM transactions WHERE stripe_payment_intent_id = $1 AND deleted_at IS NULL)",
    )
    .bind(&pi_id)
    .fetch_one(&state.pool)
    .await?;

    if already_exists {
        tracing::info!(
            pi_id = %pi_id,
            "checkout.session.completed: transaction already recorded (idempotent skip)"
        );
        return Ok(());
    }

    let booking: Option<(Decimal, String)> = sqlx::query_as(
        "SELECT commission_rate, COALESCE(currency, 'EUR') AS currency FROM bookings WHERE id = $1 AND deleted_at IS NULL",
    )
    .bind(booking_id)
    .fetch_optional(&state.pool)
    .await?;

    let (commission_rate, booking_currency) = match booking {
        Some(b) => b,
        None => {
            tracing::warn!(
                booking_id = %booking_id,
                "checkout.session.completed: booking not found"
            );
            return Ok(());
        }
    };

    let amount_cents = session.amount_total.unwrap_or(0);
    let amount = Decimal::from(amount_cents) / Decimal::from(100);

    let currency = session
        .currency
        .map(|c| c.to_string().to_uppercase())
        .unwrap_or(booking_currency);

    let platform_fee = amount * commission_rate / Decimal::from(100);
    let vendor_amount = amount - platform_fee;

    let insert_result = sqlx::query(
        r#"
        INSERT INTO transactions (
            booking_id, stripe_payment_intent_id, amount, platform_fee,
            vendor_amount, currency, status
        ) VALUES ($1, $2, $3, $4, $5, $6, 'succeeded'::payment_status)
        "#,
    )
    .bind(booking_id)
    .bind(&pi_id)
    .bind(amount)
    .bind(platform_fee)
    .bind(vendor_amount)
    .bind(&currency)
    .execute(&state.pool)
    .await;

    match insert_result {
        Ok(_) => {
            tracing::info!(
                booking_id = %booking_id,
                pi_id = %pi_id,
                amount = %amount,
                platform_fee = %platform_fee,
                vendor_amount = %vendor_amount,
                "Transaction recorded for checkout.session.completed"
            );
        }
        Err(ref e) => {
            let is_fk_violation = match e {
                sqlx::Error::Database(db_err) => db_err.code().as_deref() == Some("23503"),
                _ => false,
            };

            if is_fk_violation {
                tracing::warn!(
                    booking_id = %booking_id,
                    "FK violation: booking deleted between validation and INSERT"
                );
                return Ok(());
            }

            tracing::error!(error = %e, booking_id = %booking_id, "Failed to insert transaction");
            return Err(AppError::Internal(
                "Failed to record transaction".to_owned(),
            ));
        }
    }

    Ok(())
}

/// Process `payment_intent.succeeded`: confirm the linked booking.
///
/// Extracts `booking_id` from the PaymentIntent's metadata (propagated from
/// the Checkout Session in Increment 3). Updates booking status to `confirmed`
/// with atomic WHERE guard (same pattern as Increment 2).
///
/// Graceful returns (200): missing metadata, booking not found, already confirmed.
async fn handle_payment_intent_succeeded(
    state: &AppState,
    object: stripe::EventObject,
) -> Result<(), AppError> {
    let pi = match object {
        stripe::EventObject::PaymentIntent(pi) => pi,
        _ => {
            tracing::warn!("payment_intent.succeeded: unexpected event object type");
            return Ok(());
        }
    };

    let booking_id = pi
        .metadata
        .get("booking_id")
        .and_then(|v| Uuid::parse_str(v).ok());

    let booking_id = match booking_id {
        Some(id) => id,
        None => {
            tracing::debug!(
                pi_id = %pi.id,
                "payment_intent.succeeded: no booking_id in metadata (may not be an EviDive payment)"
            );
            return Ok(());
        }
    };

    let result = sqlx::query(
        r#"
        UPDATE bookings
        SET status = 'confirmed'::booking_status,
            confirmed_at = NOW(),
            updated_at = NOW()
        WHERE id = $1 AND status = 'pending'
        "#,
    )
    .bind(booking_id)
    .execute(&state.pool)
    .await?;

    if result.rows_affected() == 0 {
        tracing::debug!(
            booking_id = %booking_id,
            "payment_intent.succeeded: booking not pending (already confirmed or not found)"
        );
    } else {
        tracing::info!(
            booking_id = %booking_id,
            pi_id = %pi.id,
            "Booking confirmed via payment_intent.succeeded"
        );
    }

    Ok(())
}

/// Process `charge.refunded`: mark the matching transaction as refunded.
///
/// Finds the transaction via the charge's `payment_intent` ID and updates
/// its status to `refunded`.
///
/// Graceful returns (200): no payment_intent on charge, no matching transaction.
async fn handle_charge_refunded(
    state: &AppState,
    object: stripe::EventObject,
) -> Result<(), AppError> {
    let charge = match object {
        stripe::EventObject::Charge(c) => c,
        _ => {
            tracing::warn!("charge.refunded: unexpected event object type");
            return Ok(());
        }
    };

    let pi_id = match &charge.payment_intent {
        Some(pi) => match pi {
            stripe::Expandable::Id(id) => id.to_string(),
            stripe::Expandable::Object(obj) => obj.id.to_string(),
        },
        None => {
            tracing::debug!(
                charge_id = %charge.id,
                "charge.refunded: no payment_intent on charge"
            );
            return Ok(());
        }
    };

    let result = sqlx::query(
        r#"
        UPDATE transactions
        SET status = 'refunded'::payment_status,
            updated_at = NOW()
        WHERE stripe_payment_intent_id = $1 AND deleted_at IS NULL
        "#,
    )
    .bind(&pi_id)
    .execute(&state.pool)
    .await?;

    if result.rows_affected() == 0 {
        tracing::debug!(
            pi_id = %pi_id,
            "charge.refunded: no matching transaction found"
        );
    } else {
        tracing::info!(
            charge_id = %charge.id,
            pi_id = %pi_id,
            "Transaction marked as refunded"
        );
    }

    Ok(())
}

/// Process `account.updated`: sync center's Stripe Connect onboarding status.
///
/// `charges_enabled` is the authoritative signal: `true` means Stripe has
/// verified the account and it can accept payments.
async fn handle_account_updated(
    state: &AppState,
    object: stripe::EventObject,
) -> Result<(), AppError> {
    let account = match object {
        stripe::EventObject::Account(a) => a,
        _ => {
            tracing::warn!("account.updated: unexpected event object type");
            return Ok(());
        }
    };

    let account_id = account.id.to_string();
    let charges_enabled = account.charges_enabled.unwrap_or(false);

    let result = sqlx::query(
        r#"
        UPDATE centers
        SET stripe_onboarding_complete = $1,
            updated_at = NOW()
        WHERE stripe_account_id = $2 AND deleted_at IS NULL
        "#,
    )
    .bind(charges_enabled)
    .bind(&account_id)
    .execute(&state.pool)
    .await?;

    if result.rows_affected() == 0 {
        tracing::debug!(
            account_id = %account_id,
            "account.updated: no center found with this Stripe account"
        );
    } else {
        tracing::info!(
            account_id = %account_id,
            charges_enabled = charges_enabled,
            "Center Stripe onboarding status updated"
        );
    }

    Ok(())
}

/// Webhook sub-router.
///
/// Mounted at `/stripe` in [`super::api_routes`], so the full path is
/// `POST /api/v1/stripe/webhook`.
pub fn router() -> Router<Arc<AppState>> {
    Router::new().route("/webhook", axum::routing::post(handle_stripe_webhook))
}
