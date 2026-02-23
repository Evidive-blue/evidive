//! Center-level payment routes: commissions, payments, revenue, payouts.
//!
//! These routes provide authenticated center owners and members with
//! financial data and payout request capabilities.

use std::sync::Arc;

use axum::extract::{Query, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::{Json, Router};
use rust_decimal::Decimal;
use serde::Deserialize;
use uuid::Uuid;

use crate::error::AppError;
use crate::middleware::auth::{require_center_member, require_center_owner, AuthUser};
use crate::AppState;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/commissions", get(list_commissions))
        .route("/payments", get(list_payments))
        .route("/revenue", get(get_revenue_summary))
        .route("/payouts/request", post(request_payout))
}

// ──────────────────────── Types ────────────────────────

#[derive(Debug, Deserialize)]
struct CenterQuery {
    center_id: Uuid,
    limit: Option<i64>,
    offset: Option<i64>,
}

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct CommissionRow {
    booking_id: Uuid,
    booking_date: chrono::NaiveDate,
    total_price: Decimal,
    commission_rate: Decimal,
    commission_amount: Decimal,
    currency: String,
    status: String,
    service_name: Option<String>,
    client_display_name: Option<String>,
    created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct PaymentRow {
    id: Uuid,
    booking_id: Uuid,
    stripe_payment_intent_id: Option<String>,
    amount: Decimal,
    platform_fee: Decimal,
    vendor_amount: Decimal,
    currency: String,
    status: String,
    created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, serde::Serialize)]
struct RevenueSummary {
    center_id: Uuid,
    total_revenue: Decimal,
    total_commission: Decimal,
    net_revenue: Decimal,
    pending_revenue: Decimal,
    completed_revenue: Decimal,
    transaction_count: i64,
    currency: String,
}

#[derive(Debug, Deserialize)]
struct PayoutRequestBody {
    center_id: Uuid,
    amount: Decimal,
    currency: Option<String>,
}

// ──────────────────────── Commissions ────────────────────────

/// `GET /api/v1/commissions?center_id=&limit=&offset=` — auth, list commissions for a center.
async fn list_commissions(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Query(params): Query<CenterQuery>,
) -> Result<impl IntoResponse, AppError> {
    require_center_member(&state.pool, claims.sub, params.center_id).await?;

    let limit = params.limit.unwrap_or(50).min(200);
    let offset = params.offset.unwrap_or(0).max(0);

    let rows = sqlx::query_as::<_, CommissionRow>(
        r#"
        SELECT b.id AS booking_id, b.booking_date, b.total_price,
               b.commission_rate, b.commission_amount,
               COALESCE(b.currency, 'EUR') AS currency,
               b.status::text AS status,
               s.name AS service_name,
               p.display_name AS client_display_name,
               b.created_at
        FROM bookings b
        LEFT JOIN services s ON s.id = b.service_id AND s.deleted_at IS NULL
        LEFT JOIN profiles p ON p.id = b.client_id AND p.deleted_at IS NULL
        WHERE b.center_id = $1
          AND b.deleted_at IS NULL
        ORDER BY b.created_at DESC
        LIMIT $2 OFFSET $3
        "#,
    )
    .bind(params.center_id)
    .bind(limit)
    .bind(offset)
    .fetch_all(&state.pool)
    .await?;

    Ok((StatusCode::OK, Json(serde_json::json!({ "data": rows }))))
}

// ──────────────────────── Payments / Transactions ────────────────────────

/// `GET /api/v1/payments?center_id=&limit=&offset=` — auth, list transactions for a center.
async fn list_payments(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Query(params): Query<CenterQuery>,
) -> Result<impl IntoResponse, AppError> {
    require_center_member(&state.pool, claims.sub, params.center_id).await?;

    let limit = params.limit.unwrap_or(50).min(200);
    let offset = params.offset.unwrap_or(0).max(0);

    let rows = sqlx::query_as::<_, PaymentRow>(
        r#"
        SELECT t.id, t.booking_id, t.stripe_payment_intent_id,
               t.amount, t.platform_fee, t.vendor_amount,
               COALESCE(t.currency, 'EUR') AS currency,
               t.status::text AS status,
               t.created_at
        FROM transactions t
        INNER JOIN bookings b ON b.id = t.booking_id AND b.deleted_at IS NULL
        WHERE b.center_id = $1
          AND t.deleted_at IS NULL
        ORDER BY t.created_at DESC
        LIMIT $2 OFFSET $3
        "#,
    )
    .bind(params.center_id)
    .bind(limit)
    .bind(offset)
    .fetch_all(&state.pool)
    .await?;

    Ok((StatusCode::OK, Json(serde_json::json!({ "data": rows }))))
}

// ──────────────────────── Revenue Summary ────────────────────────

#[derive(Debug, Deserialize)]
struct RevenueSummaryQuery {
    center_id: Uuid,
}

/// `GET /api/v1/revenue?center_id=` — auth, get revenue summary for a center.
async fn get_revenue_summary(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Query(params): Query<RevenueSummaryQuery>,
) -> Result<impl IntoResponse, AppError> {
    require_center_member(&state.pool, claims.sub, params.center_id).await?;

    // Aggregate from bookings (confirmed + completed)
    let booking_stats = sqlx::query_as::<_, (Option<Decimal>, Option<Decimal>, Option<Decimal>, Option<Decimal>)>(
        r#"
        SELECT
            SUM(total_price) FILTER (WHERE status IN ('confirmed', 'completed')),
            SUM(commission_amount) FILTER (WHERE status IN ('confirmed', 'completed')),
            SUM(total_price) FILTER (WHERE status = 'pending'),
            SUM(total_price) FILTER (WHERE status = 'completed')
        FROM bookings
        WHERE center_id = $1 AND deleted_at IS NULL
        "#,
    )
    .bind(params.center_id)
    .fetch_one(&state.pool)
    .await?;

    let total_revenue = booking_stats.0.unwrap_or(Decimal::ZERO);
    let total_commission = booking_stats.1.unwrap_or(Decimal::ZERO);
    let pending_revenue = booking_stats.2.unwrap_or(Decimal::ZERO);
    let completed_revenue = booking_stats.3.unwrap_or(Decimal::ZERO);

    let transaction_count: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(*)
        FROM transactions t
        INNER JOIN bookings b ON b.id = t.booking_id
        WHERE b.center_id = $1 AND t.deleted_at IS NULL
        "#,
    )
    .bind(params.center_id)
    .fetch_one(&state.pool)
    .await?;

    let currency: String = sqlx::query_scalar(
        "SELECT COALESCE(currency, 'EUR') FROM centers WHERE id = $1",
    )
    .bind(params.center_id)
    .fetch_one(&state.pool)
    .await?;

    let summary = RevenueSummary {
        center_id: params.center_id,
        total_revenue,
        total_commission,
        net_revenue: total_revenue - total_commission,
        pending_revenue,
        completed_revenue,
        transaction_count,
        currency,
    };

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({ "data": summary })),
    ))
}

// ──────────────────────── Payout Request ────────────────────────

/// `POST /api/v1/payouts/request` — auth, request a payout for a center.
async fn request_payout(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Json(body): Json<PayoutRequestBody>,
) -> Result<impl IntoResponse, AppError> {
    require_center_owner(&state.pool, claims.sub, body.center_id).await?;

    if body.amount <= Decimal::ZERO {
        return Err(AppError::BadRequest(
            "Payout amount must be greater than zero".to_owned(),
        ));
    }

    // Verify the center has a completed Stripe onboarding
    let stripe_info: Option<(Option<String>, Option<bool>)> = sqlx::query_as(
        "SELECT stripe_account_id, stripe_onboarding_complete FROM centers WHERE id = $1 AND deleted_at IS NULL",
    )
    .bind(body.center_id)
    .fetch_optional(&state.pool)
    .await?;

    let (stripe_account_id, onboarding_complete) = stripe_info
        .ok_or_else(|| AppError::NotFound("Center not found".to_owned()))?;

    let stripe_account_id = stripe_account_id.ok_or_else(|| {
        AppError::BadRequest("Center has no Stripe account configured".to_owned())
    })?;

    if !onboarding_complete.unwrap_or(false) {
        return Err(AppError::BadRequest(
            "Stripe onboarding is not complete for this center".to_owned(),
        ));
    }

    // Check available balance (net revenue minus already paid out)
    let net_available = sqlx::query_scalar::<_, Option<Decimal>>(
        r#"
        SELECT SUM(b.total_price - b.commission_amount)
        FROM bookings b
        WHERE b.center_id = $1
          AND b.status = 'completed'
          AND b.deleted_at IS NULL
        "#,
    )
    .bind(body.center_id)
    .fetch_one(&state.pool)
    .await?
    .unwrap_or(Decimal::ZERO);

    if body.amount > net_available {
        return Err(AppError::BadRequest(format!(
            "Requested amount ({}) exceeds available balance ({})",
            body.amount, net_available
        )));
    }

    // Create the Stripe transfer
    let currency_str = body.currency.as_deref().unwrap_or("EUR").to_lowercase();
    let amount_cents = (body.amount * Decimal::from(100))
        .to_string()
        .parse::<i64>()
        .map_err(|_| AppError::BadRequest("Invalid payout amount".to_owned()))?;

    let parsed_currency: stripe::Currency = currency_str
        .parse()
        .map_err(|_| AppError::BadRequest(format!("Unsupported currency: {currency_str}")))?;

    let mut transfer_params =
        stripe::CreateTransfer::new(parsed_currency, stripe_account_id.clone());
    transfer_params.amount = Some(amount_cents);
    let description = format!("Payout for center {}", body.center_id);
    transfer_params.description = Some(&description);

    let transfer = stripe::Transfer::create(&state.stripe, transfer_params)
        .await
        .map_err(|e| AppError::Internal(format!("Stripe transfer failed: {e}")))?;

    Ok((
        StatusCode::CREATED,
        Json(serde_json::json!({
            "data": {
                "transfer_id": transfer.id.to_string(),
                "amount": body.amount,
                "currency": currency_str,
                "status": "created"
            }
        })),
    ))
}
