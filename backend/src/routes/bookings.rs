//! Booking routes: create, list, detail, cancel, confirm, availability.

use std::sync::Arc;

use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::{Json, Router};
use rust_decimal::Decimal;
use serde::Deserialize;
use uuid::Uuid;

use crate::error::AppError;
use crate::middleware::auth::{require_center_member, AuthUser};
use crate::AppState;

/// Read the platform commission rate from `t_platform_config` (key = `commission_rate`).
/// Falls back to 20% if no value is stored yet.
async fn platform_commission_rate(pool: &sqlx::PgPool) -> Result<Decimal, AppError> {
    let stored: Option<String> = sqlx::query_scalar(
        "SELECT value FROM t_platform_config WHERE key = 'commission_rate'",
    )
    .fetch_optional(pool)
    .await?;

    match stored {
        Some(v) => v
            .parse::<Decimal>()
            .map_err(|_| AppError::Internal(format!("Invalid commission_rate in platform config: {v}"))),
        None => Ok(Decimal::from(20)),
    }
}

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/bookings", post(create_booking).get(list_my_bookings))
        .route("/bookings/availability", get(check_availability))
        .route("/bookings/{booking_id}", get(get_booking_by_id))
        .route("/bookings/{booking_id}/cancel", post(cancel_booking))
        .route("/bookings/{booking_id}/confirm", post(confirm_booking))
        .route("/bookings/{booking_id}/checkout", post(checkout_booking))
}

// ──────────────────────── Types ────────────────────────

#[derive(Debug, sqlx::FromRow)]
struct ServiceLookup {
    #[allow(dead_code)]
    id: Uuid,
    center_id: Uuid,
    price: Decimal,
    currency: String,
    max_capacity: Option<i32>,
    min_participants: Option<i32>,
    is_active: Option<bool>,
}

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct BookingRow {
    id: Uuid,
    client_id: Uuid,
    center_id: Uuid,
    service_id: Option<Uuid>,
    booking_date: chrono::NaiveDate,
    time_slot: chrono::NaiveTime,
    participants: i32,
    unit_price: Decimal,
    total_price: Decimal,
    commission_rate: Decimal,
    commission_amount: Decimal,
    currency: String,
    client_note: Option<String>,
    status: String,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
    center_name: Option<String>,
    service_name: Option<String>,
}

// ──────────────────────── Create ────────────────────────

#[derive(Debug, Deserialize)]
struct CreateBookingBody {
    service_id: Uuid,
    center_id: Uuid,
    booking_date: String,
    time_slot: String,
    participants: i32,
    client_note: Option<String>,
}

/// `POST /api/v1/bookings` — create a booking (authenticated diver).
async fn create_booking(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Json(body): Json<CreateBookingBody>,
) -> Result<impl IntoResponse, AppError> {
    let booking_date = chrono::NaiveDate::parse_from_str(&body.booking_date, "%Y-%m-%d")
        .map_err(|_| AppError::BadRequest("Invalid date format, expected YYYY-MM-DD".to_owned()))?;

    let today = chrono::Utc::now().date_naive();
    if booking_date < today {
        return Err(AppError::BadRequest(
            "Booking date must be today or later".to_owned(),
        ));
    }

    let time_slot = chrono::NaiveTime::parse_from_str(&body.time_slot, "%H:%M")
        .map_err(|_| AppError::BadRequest("Invalid time format, expected HH:MM".to_owned()))?;

    if body.participants < 1 {
        return Err(AppError::BadRequest(
            "At least 1 participant required".to_owned(),
        ));
    }

    let service = sqlx::query_as::<_, ServiceLookup>(
        r#"
        SELECT id, center_id, price, currency, max_capacity, min_participants, is_active
        FROM services
        WHERE id = $1 AND deleted_at IS NULL
        "#,
    )
    .bind(body.service_id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Service not found".to_owned()))?;

    if service.center_id != body.center_id {
        return Err(AppError::BadRequest(
            "Service does not belong to this center".to_owned(),
        ));
    }
    if !service.is_active.unwrap_or(false) {
        return Err(AppError::BadRequest(
            "Service is not currently active".to_owned(),
        ));
    }
    if body.participants > service.max_capacity.unwrap_or(20) {
        return Err(AppError::BadRequest(
            "Exceeds maximum capacity for this service".to_owned(),
        ));
    }
    if body.participants < service.min_participants.unwrap_or(1) {
        return Err(AppError::BadRequest(
            "Below minimum participants for this service".to_owned(),
        ));
    }

    // Check blocked date
    let is_blocked: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM blocked_dates WHERE center_id = $1 AND blocked_date = $2)",
    )
    .bind(body.center_id)
    .bind(booking_date)
    .fetch_one(&state.pool)
    .await?;

    if is_blocked {
        return Err(AppError::BadRequest(
            "This date is blocked by the center".to_owned(),
        ));
    }

    // Prevent double-booking
    let double_booking_exists: bool = sqlx::query_scalar(
        r#"
        SELECT EXISTS(
            SELECT 1 FROM bookings
            WHERE service_id = $1 AND booking_date = $2 AND time_slot = $3
              AND status NOT IN ('cancelled') AND deleted_at IS NULL
        )
        "#,
    )
    .bind(body.service_id)
    .bind(booking_date)
    .bind(time_slot)
    .fetch_one(&state.pool)
    .await?;

    if double_booking_exists {
        return Err(AppError::Conflict(
            "This time slot is already booked".to_owned(),
        ));
    }

    let unit_price = service.price;
    let total_price = unit_price * Decimal::from(body.participants);
    let rate = platform_commission_rate(&state.pool).await?;
    let commission_amount = total_price * rate / Decimal::from(100);

    let booking_id: Uuid = sqlx::query_scalar(
        r#"
        INSERT INTO bookings (
            client_id, center_id, service_id, booking_date, time_slot,
            participants, unit_price, total_price, commission_rate, commission_amount,
            currency, client_note, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending')
        RETURNING id
        "#,
    )
    .bind(claims.sub)
    .bind(body.center_id)
    .bind(body.service_id)
    .bind(booking_date)
    .bind(time_slot)
    .bind(body.participants)
    .bind(unit_price)
    .bind(total_price)
    .bind(rate)
    .bind(commission_amount)
    .bind(&service.currency)
    .bind(body.client_note.as_deref().map(str::trim))
    .fetch_one(&state.pool)
    .await?;

    Ok((
        StatusCode::CREATED,
        Json(serde_json::json!({
            "data": {
                "id": booking_id,
                "status": "pending",
                "total_price": total_price,
                "currency": service.currency
            }
        })),
    ))
}

// ──────────────────────── List my bookings ────────────────────────

#[derive(Debug, Deserialize)]
struct ListBookingsQuery {
    status: Option<String>,
    limit: Option<i64>,
}

/// `GET /api/v1/bookings` — list authenticated user's bookings.
async fn list_my_bookings(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Query(params): Query<ListBookingsQuery>,
) -> Result<impl IntoResponse, AppError> {
    let limit = params.limit.unwrap_or(50).min(200);

    let rows = if let Some(ref status) = params.status {
        sqlx::query_as::<_, BookingRow>(
            r#"
            SELECT b.id, b.client_id, b.center_id, b.service_id, b.booking_date,
                   b.time_slot, b.participants, b.unit_price, b.total_price,
                   b.commission_rate, b.commission_amount, b.currency, b.client_note,
                   b.status::text AS status, b.created_at, b.updated_at,
                   c.name AS center_name, s.name AS service_name
            FROM bookings b
            LEFT JOIN centers c ON c.id = b.center_id AND c.deleted_at IS NULL
            LEFT JOIN services s ON s.id = b.service_id AND s.deleted_at IS NULL
            WHERE b.client_id = $1 AND b.status::text = $2 AND b.deleted_at IS NULL
            ORDER BY b.booking_date DESC
            LIMIT $3
            "#,
        )
        .bind(claims.sub)
        .bind(status)
        .bind(limit)
        .fetch_all(&state.pool)
        .await?
    } else {
        sqlx::query_as::<_, BookingRow>(
            r#"
            SELECT b.id, b.client_id, b.center_id, b.service_id, b.booking_date,
                   b.time_slot, b.participants, b.unit_price, b.total_price,
                   b.commission_rate, b.commission_amount, b.currency, b.client_note,
                   b.status::text AS status, b.created_at, b.updated_at,
                   c.name AS center_name, s.name AS service_name
            FROM bookings b
            LEFT JOIN centers c ON c.id = b.center_id AND c.deleted_at IS NULL
            LEFT JOIN services s ON s.id = b.service_id AND s.deleted_at IS NULL
            WHERE b.client_id = $1 AND b.deleted_at IS NULL
            ORDER BY b.booking_date DESC
            LIMIT $2
            "#,
        )
        .bind(claims.sub)
        .bind(limit)
        .fetch_all(&state.pool)
        .await?
    };

    Ok((StatusCode::OK, Json(serde_json::json!({ "data": rows }))))
}

// ──────────────────────── Get by ID ────────────────────────

/// `GET /api/v1/bookings/{booking_id}` — get a single booking (owner or center member).
async fn get_booking_by_id(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(booking_id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let row = sqlx::query_as::<_, BookingRow>(
        r#"
        SELECT b.id, b.client_id, b.center_id, b.service_id, b.booking_date,
               b.time_slot, b.participants, b.unit_price, b.total_price,
               b.commission_rate, b.commission_amount, b.currency, b.client_note,
               b.status::text AS status, b.created_at, b.updated_at,
               c.name AS center_name, s.name AS service_name
        FROM bookings b
        LEFT JOIN centers c ON c.id = b.center_id AND c.deleted_at IS NULL
        LEFT JOIN services s ON s.id = b.service_id AND s.deleted_at IS NULL
        WHERE b.id = $1 AND b.deleted_at IS NULL
        "#,
    )
    .bind(booking_id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Booking not found".to_owned()))?;

    // Allow access if user is the client or a center member
    if row.client_id != claims.sub {
        require_center_member(&state.pool, claims.sub, row.center_id).await?;
    }

    Ok((StatusCode::OK, Json(serde_json::json!({ "data": row }))))
}

// ──────────────────────── Cancel ────────────────────────

/// `POST /api/v1/bookings/{booking_id}/cancel` — cancel a booking.
async fn cancel_booking(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(booking_id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    // Verify ownership or center membership
    let booking = sqlx::query_as::<_, (Uuid, Uuid, String)>(
        r#"
        SELECT client_id, center_id, status::text
        FROM bookings WHERE id = $1 AND deleted_at IS NULL
        "#,
    )
    .bind(booking_id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Booking not found".to_owned()))?;

    if booking.0 != claims.sub {
        require_center_member(&state.pool, claims.sub, booking.1).await?;
    }

    if booking.2 == "cancelled" || booking.2 == "completed" {
        return Err(AppError::BadRequest(format!(
            "Cannot cancel a booking with status '{}'",
            booking.2
        )));
    }

    let result = sqlx::query(
        r#"
        UPDATE bookings
        SET status = 'cancelled'::booking_status,
            cancelled_at = NOW(),
            updated_at = NOW()
        WHERE id = $1 AND status IN ('pending', 'confirmed')
        "#,
    )
    .bind(booking_id)
    .execute(&state.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::Conflict(
            "Booking status changed concurrently".to_owned(),
        ));
    }

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({ "message": "Booking cancelled", "status": "cancelled" })),
    ))
}

// ──────────────────────── Confirm ────────────────────────

/// `POST /api/v1/bookings/{booking_id}/confirm` — confirm a pending booking (center member).
async fn confirm_booking(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(booking_id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let booking = sqlx::query_as::<_, (Uuid, String)>(
        "SELECT center_id, status::text FROM bookings WHERE id = $1 AND deleted_at IS NULL",
    )
    .bind(booking_id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Booking not found".to_owned()))?;

    require_center_member(&state.pool, claims.sub, booking.0).await?;

    if booking.1 != "pending" {
        return Err(AppError::BadRequest(format!(
            "Only pending bookings can be confirmed, current status: '{}'",
            booking.1
        )));
    }

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
        return Err(AppError::Conflict(
            "Booking is no longer pending (concurrent modification)".to_owned(),
        ));
    }

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({ "message": "Booking confirmed", "status": "confirmed" })),
    ))
}

// ──────────────────────── Checkout ────────────────────────

#[derive(Debug, sqlx::FromRow)]
struct CheckoutBookingRow {
    client_id: Uuid,
    center_id: Uuid,
    total_price: Decimal,
    commission_amount: Decimal,
    currency: String,
    status: String,
    service_name: String,
}

/// `POST /api/v1/bookings/{booking_id}/checkout` — create a Stripe Checkout Session.
///
/// Returns a checkout URL the frontend uses to redirect the customer to Stripe.
/// Metadata (`booking_id`) is attached to both the session and the PaymentIntent
/// so the webhook handler can correlate the payment with the booking.
///
/// If the center has a connected Stripe account, the payment is routed there
/// with the platform commission deducted as `application_fee_amount`.
async fn checkout_booking(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(booking_id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let booking = sqlx::query_as::<_, CheckoutBookingRow>(
        r#"
        SELECT b.client_id, b.center_id, b.total_price, b.commission_amount,
               COALESCE(b.currency, 'EUR') AS currency, b.status::text AS status,
               COALESCE(s.name, 'Dive booking') AS service_name
        FROM bookings b
        LEFT JOIN services s ON s.id = b.service_id AND s.deleted_at IS NULL
        WHERE b.id = $1 AND b.deleted_at IS NULL
        "#,
    )
    .bind(booking_id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Booking not found".to_owned()))?;

    if booking.client_id != claims.sub {
        return Err(AppError::Forbidden);
    }
    if booking.status != "pending" {
        return Err(AppError::BadRequest(format!(
            "Only pending bookings can be checked out, current status: '{}'",
            booking.status
        )));
    }

    let amount_cents = (booking.total_price * Decimal::from(100))
        .to_string()
        .parse::<i64>()
        .map_err(|_| AppError::Internal("Invalid total price conversion".to_owned()))?;

    let commission_cents = (booking.commission_amount * Decimal::from(100))
        .to_string()
        .parse::<i64>()
        .map_err(|_| AppError::Internal("Invalid commission amount conversion".to_owned()))?;

    let currency_str = booking.currency.to_lowercase();
    let currency: stripe::Currency = currency_str
        .parse()
        .map_err(|_| AppError::Internal(format!("Unsupported currency: {}", booking.currency)))?;

    let base_url = state
        .config
        .cors_origin
        .split(',')
        .next()
        .unwrap_or_default()
        .trim();

    let success_url = format!("{base_url}/bookings/{booking_id}?status=success");
    let cancel_url = format!("{base_url}/bookings/{booking_id}?status=cancelled");

    let mut metadata = std::collections::HashMap::new();
    metadata.insert("booking_id".to_owned(), booking_id.to_string());

    let connect_account_id = sqlx::query_as::<_, (Option<String>, Option<bool>)>(
        "SELECT stripe_account_id, stripe_onboarding_complete FROM centers WHERE id = $1 AND deleted_at IS NULL",
    )
    .bind(booking.center_id)
    .fetch_optional(&state.pool)
    .await?
    .and_then(|(acct_id, onboarded)| match (acct_id, onboarded) {
        (Some(id), Some(true)) if !id.is_empty() => Some(id),
        _ => None,
    });

    let mut payment_intent_data = stripe::CreateCheckoutSessionPaymentIntentData {
        metadata: Some(metadata.clone()),
        ..Default::default()
    };

    if let Some(ref acct_id) = connect_account_id {
        payment_intent_data.application_fee_amount = Some(commission_cents);
        payment_intent_data.transfer_data = Some(
            stripe::CreateCheckoutSessionPaymentIntentDataTransferData {
                destination: acct_id.clone(),
                ..Default::default()
            },
        );
    }

    let params = stripe::CreateCheckoutSession {
        mode: Some(stripe::CheckoutSessionMode::Payment),
        line_items: Some(vec![stripe::CreateCheckoutSessionLineItems {
            price_data: Some(stripe::CreateCheckoutSessionLineItemsPriceData {
                currency,
                unit_amount: Some(amount_cents),
                product_data: Some(
                    stripe::CreateCheckoutSessionLineItemsPriceDataProductData {
                        name: booking.service_name,
                        ..Default::default()
                    },
                ),
                ..Default::default()
            }),
            quantity: Some(1),
            ..Default::default()
        }]),
        metadata: Some(metadata),
        payment_intent_data: Some(payment_intent_data),
        success_url: Some(&success_url),
        cancel_url: Some(&cancel_url),
        ..Default::default()
    };

    let session = stripe::CheckoutSession::create(&state.stripe, params)
        .await
        .map_err(|e| AppError::Internal(format!("Stripe Checkout Session creation failed: {e}")))?;

    let checkout_url = session
        .url
        .ok_or_else(|| AppError::Internal("Stripe returned a session without a URL".to_owned()))?;

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({ "data": { "checkout_url": checkout_url } })),
    ))
}

// ──────────────────────── Availability ────────────────────────

#[derive(Debug, Deserialize)]
struct AvailabilityQuery {
    service_id: Uuid,
    date: String,
}

#[derive(Debug, serde::Serialize)]
struct TimeSlotAvailability {
    time_slot: String,
    available: bool,
}

/// `GET /api/v1/bookings/availability` — check available time slots for a service on a date.
async fn check_availability(
    State(state): State<Arc<AppState>>,
    Query(params): Query<AvailabilityQuery>,
) -> Result<impl IntoResponse, AppError> {
    let date = chrono::NaiveDate::parse_from_str(&params.date, "%Y-%m-%d")
        .map_err(|_| AppError::BadRequest("Invalid date format, expected YYYY-MM-DD".to_owned()))?;

    // Get the center_id from the service
    let center_id: Option<Uuid> = sqlx::query_scalar(
        "SELECT center_id FROM services WHERE id = $1 AND deleted_at IS NULL",
    )
    .bind(params.service_id)
    .fetch_optional(&state.pool)
    .await?;

    let center_id =
        center_id.ok_or_else(|| AppError::NotFound("Service not found".to_owned()))?;

    // Check if date is blocked
    let is_blocked: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM blocked_dates WHERE center_id = $1 AND blocked_date = $2)",
    )
    .bind(center_id)
    .bind(date)
    .fetch_one(&state.pool)
    .await?;

    if is_blocked {
        return Ok((
            StatusCode::OK,
            Json(serde_json::json!({ "data": { "available": false, "reason": "date_blocked", "slots": [] } })),
        ));
    }

    // Get booked time slots for this service on this date
    let booked_slots: Vec<chrono::NaiveTime> = sqlx::query_scalar(
        r#"
        SELECT time_slot FROM bookings
        WHERE service_id = $1 AND booking_date = $2
          AND status NOT IN ('cancelled') AND deleted_at IS NULL
        "#,
    )
    .bind(params.service_id)
    .bind(date)
    .fetch_all(&state.pool)
    .await?;

    // Generate standard time slots (every hour from 08:00 to 17:00)
    let slots: Vec<TimeSlotAvailability> = (8..=17)
        .map(|hour| {
            let slot_time =
                chrono::NaiveTime::from_hms_opt(hour, 0, 0).unwrap_or_default();
            let slot_str = format!("{:02}:00", hour);
            let available = !booked_slots.contains(&slot_time);
            TimeSlotAvailability {
                time_slot: slot_str,
                available,
            }
        })
        .collect();

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({ "data": { "available": true, "slots": slots } })),
    ))
}
