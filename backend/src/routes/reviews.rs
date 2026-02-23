//! Public review endpoints and authenticated review creation.
//!
//! These routes provide:
//! - Public listing of published reviews for a center
//! - Authenticated review submission (requires a completed booking)
//! - Listing eligible bookings for review

use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::get,
    Json, Router,
};
use serde::Deserialize;
use std::sync::Arc;
use uuid::Uuid;

use crate::error::AppError;
use crate::middleware::auth::AuthUser;
use crate::AppState;

/// Published review visible to the public.
#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct PublicReview {
    id: Uuid,
    rating: i32,
    comment: Option<String>,
    created_at: chrono::DateTime<chrono::Utc>,
    display_name: Option<String>,
}

/// `GET /api/v1/reviews/center/{center_id}` — public, list published reviews.
async fn list_public_reviews(
    State(state): State<Arc<AppState>>,
    Path(center_id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let reviews = sqlx::query_as::<_, PublicReview>(
        r#"
        SELECT r.id, r.rating, r.comment, r.created_at,
               p.display_name
        FROM reviews r
        LEFT JOIN profiles p ON p.id = r.client_id AND p.deleted_at IS NULL
        WHERE r.center_id = $1
          AND r.is_published = true
          AND r.deleted_at IS NULL
        ORDER BY r.created_at DESC
        LIMIT 50
        "#,
    )
    .bind(center_id)
    .fetch_all(&state.pool)
    .await?;

    Ok((StatusCode::OK, Json(serde_json::json!({ "data": reviews }))))
}

/// Eligible booking for review.
#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct EligibleBooking {
    id: Uuid,
    booking_date: chrono::NaiveDate,
    service_name: Option<String>,
}

/// `GET /api/v1/reviews/eligible/{center_id}` — auth, list bookings available for review.
async fn list_eligible_bookings(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(center_id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let eligible = sqlx::query_as::<_, EligibleBooking>(
        r#"
        SELECT b.id, b.booking_date, s.name AS service_name
        FROM bookings b
        LEFT JOIN services s ON s.id = b.service_id AND s.deleted_at IS NULL
        WHERE b.client_id = $1
          AND b.center_id = $2
          AND b.status = 'completed'
          AND b.deleted_at IS NULL
          AND NOT EXISTS (
              SELECT 1 FROM reviews rv
              WHERE rv.booking_id = b.id
                AND rv.client_id = $1
                AND rv.deleted_at IS NULL
          )
        ORDER BY b.booking_date DESC
        LIMIT 50
        "#,
    )
    .bind(claims.sub)
    .bind(center_id)
    .fetch_all(&state.pool)
    .await?;

    Ok((StatusCode::OK, Json(serde_json::json!({ "data": eligible }))))
}

/// Body for creating a review.
#[derive(Debug, Deserialize)]
struct CreateReviewBody {
    center_id: Uuid,
    booking_id: Uuid,
    rating: i32,
    comment: Option<String>,
}

/// `POST /api/v1/reviews` — auth, create a review for a completed booking.
async fn create_review(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Json(body): Json<CreateReviewBody>,
) -> Result<impl IntoResponse, AppError> {
    // Validate rating
    if !(1..=5).contains(&body.rating) {
        return Err(AppError::BadRequest(
            "Rating must be between 1 and 5".to_owned(),
        ));
    }

    // Verify the booking belongs to this user, is completed, and is at this center
    let booking_valid: bool = sqlx::query_scalar(
        r#"
        SELECT EXISTS(
            SELECT 1 FROM bookings
            WHERE id = $1
              AND client_id = $2
              AND center_id = $3
              AND status = 'completed'
              AND deleted_at IS NULL
        )
        "#,
    )
    .bind(body.booking_id)
    .bind(claims.sub)
    .bind(body.center_id)
    .fetch_one(&state.pool)
    .await?;

    if !booking_valid {
        return Err(AppError::BadRequest(
            "No matching completed booking found".to_owned(),
        ));
    }

    // Prevent duplicate review for the same booking
    let already_reviewed: bool = sqlx::query_scalar(
        r#"
        SELECT EXISTS(
            SELECT 1 FROM reviews
            WHERE booking_id = $1
              AND client_id = $2
              AND deleted_at IS NULL
        )
        "#,
    )
    .bind(body.booking_id)
    .bind(claims.sub)
    .fetch_one(&state.pool)
    .await?;

    if already_reviewed {
        return Err(AppError::Conflict(
            "A review already exists for this booking".to_owned(),
        ));
    }

    let review_id: Uuid = sqlx::query_scalar(
        r#"
        INSERT INTO reviews (client_id, center_id, booking_id, rating, comment, is_published)
        VALUES ($1, $2, $3, $4, $5, true)
        RETURNING id
        "#,
    )
    .bind(claims.sub)
    .bind(body.center_id)
    .bind(body.booking_id)
    .bind(body.rating)
    .bind(body.comment.as_deref().map(str::trim))
    .fetch_one(&state.pool)
    .await?;

    Ok((
        StatusCode::CREATED,
        Json(serde_json::json!({ "data": { "id": review_id } })),
    ))
}

/// Booking row eligible for review (center-side view).
#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct ReviewableBookingRow {
    id: Uuid,
    client_id: Uuid,
    booking_date: chrono::NaiveDate,
    time_slot: chrono::NaiveTime,
    participants: i32,
    status: String,
    service_name: Option<String>,
    client_display_name: Option<String>,
}

/// `GET /api/v1/reviews/reviewable-bookings/{center_id}` — auth, list bookings for which
/// a review can be submitted (completed, no existing review).
/// This is the center-facing endpoint used by the dashboard.
async fn list_reviewable_bookings(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(center_id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    crate::middleware::auth::require_center_member(&state.pool, claims.sub, center_id).await?;

    let rows = sqlx::query_as::<_, ReviewableBookingRow>(
        r#"
        SELECT b.id, b.client_id, b.booking_date, b.time_slot,
               b.participants, b.status::text AS status,
               s.name AS service_name,
               p.display_name AS client_display_name
        FROM bookings b
        LEFT JOIN services s ON s.id = b.service_id AND s.deleted_at IS NULL
        LEFT JOIN profiles p ON p.id = b.client_id AND p.deleted_at IS NULL
        WHERE b.center_id = $1
          AND b.status = 'completed'
          AND b.deleted_at IS NULL
          AND NOT EXISTS (
              SELECT 1 FROM reviews rv
              WHERE rv.booking_id = b.id
                AND rv.deleted_at IS NULL
          )
        ORDER BY b.booking_date DESC
        LIMIT 100
        "#,
    )
    .bind(center_id)
    .fetch_all(&state.pool)
    .await?;

    Ok((StatusCode::OK, Json(serde_json::json!({ "data": rows }))))
}

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/reviews/center/{center_id}", get(list_public_reviews))
        .route(
            "/reviews/eligible/{center_id}",
            get(list_eligible_bookings),
        )
        .route(
            "/reviews/reviewable-bookings/{center_id}",
            get(list_reviewable_bookings),
        )
        .route("/reviews", axum::routing::post(create_review))
}
