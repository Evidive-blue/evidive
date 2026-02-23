//! Service routes: public listing + authenticated CRUD for center members.

use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::get,
    Json, Router,
};
use rust_decimal::Decimal;
use serde::Deserialize;
use std::sync::Arc;
use uuid::Uuid;

use crate::error::AppError;
use crate::middleware::auth::{require_center_member, AuthUser};
use crate::models::ServiceRow;
use crate::AppState;

/// GET /api/v1/centers/{slug}/services — public: list active services for a center.
async fn list_services_by_center_slug(
    State(state): State<Arc<AppState>>,
    Path(slug): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    let rows = sqlx::query_as::<_, ServiceRow>(
        r#"
        SELECT s.id, s.center_id, s.name, s.description, s.category, s.duration_minutes,
               s.max_capacity, s.min_participants, s.price, s.currency, s.min_certification,
               s.min_dives, s.is_active
        FROM services s
        JOIN centers c ON c.id = s.center_id
        WHERE c.slug = $1 AND c.status = 'active' AND c.deleted_at IS NULL
              AND s.is_active = true AND s.deleted_at IS NULL
        ORDER BY s.name ASC
        LIMIT 200
        "#,
    )
    .bind(&slug)
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(serde_json::json!({ "data": rows })))
}

// ──────────────────────── Authenticated center member endpoints ────────────────────────

/// Helper: resolve slug to center_id and verify membership.
async fn resolve_center_and_check_membership(
    pool: &sqlx::PgPool,
    slug: &str,
    user_id: Uuid,
) -> Result<Uuid, AppError> {
    let center_id: Option<Uuid> =
        sqlx::query_scalar("SELECT id FROM centers WHERE slug = $1 AND deleted_at IS NULL")
            .bind(slug)
            .fetch_optional(pool)
            .await?;

    let center_id =
        center_id.ok_or_else(|| AppError::NotFound(format!("Center '{slug}' not found")))?;

    require_center_member(pool, user_id, center_id).await?;
    Ok(center_id)
}

/// Body for creating a new service.
#[derive(Debug, Deserialize)]
struct CreateServiceBody {
    name: String,
    description: Option<String>,
    category: Option<String>,
    duration_minutes: i32,
    max_capacity: i32,
    min_participants: Option<i32>,
    price: Decimal,
    currency: Option<String>,
    min_certification: Option<String>,
    min_dives: Option<i32>,
}

/// `POST /api/v1/centers/{slug}/services` — create a service (center member).
async fn create_service(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(slug): Path<String>,
    Json(body): Json<CreateServiceBody>,
) -> Result<impl IntoResponse, AppError> {
    let center_id = resolve_center_and_check_membership(&state.pool, &slug, claims.sub).await?;

    let name = body.name.trim();
    if name.is_empty() {
        return Err(AppError::BadRequest("Service name is required".to_owned()));
    }
    if body.duration_minutes <= 0 {
        return Err(AppError::BadRequest(
            "Duration must be greater than 0".to_owned(),
        ));
    }
    if body.max_capacity <= 0 {
        return Err(AppError::BadRequest(
            "Max capacity must be greater than 0".to_owned(),
        ));
    }
    if body.price < Decimal::ZERO {
        return Err(AppError::BadRequest(
            "Price must be zero or positive".to_owned(),
        ));
    }

    let service_id: Uuid = sqlx::query_scalar(
        r#"
        INSERT INTO services (center_id, name, description, category, duration_minutes,
                              max_capacity, min_participants, price, currency,
                              min_certification, min_dives, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
        RETURNING id
        "#,
    )
    .bind(center_id)
    .bind(name)
    .bind(body.description.as_deref().map(str::trim))
    .bind(body.category.as_deref().map(str::trim))
    .bind(body.duration_minutes)
    .bind(body.max_capacity)
    .bind(body.min_participants)
    .bind(body.price)
    .bind(body.currency.as_deref().unwrap_or("EUR"))
    .bind(body.min_certification.as_deref())
    .bind(body.min_dives)
    .fetch_one(&state.pool)
    .await?;

    Ok((
        StatusCode::CREATED,
        Json(serde_json::json!({ "data": { "id": service_id } })),
    ))
}

/// Body for updating a service (all fields optional).
#[derive(Debug, Deserialize)]
struct UpdateServiceBody {
    name: Option<String>,
    description: Option<String>,
    category: Option<String>,
    duration_minutes: Option<i32>,
    max_capacity: Option<i32>,
    min_participants: Option<i32>,
    price: Option<Decimal>,
    currency: Option<String>,
    min_certification: Option<String>,
    min_dives: Option<i32>,
    is_active: Option<bool>,
}

/// `PATCH /api/v1/centers/{slug}/services/{service_id}` — update a service (center member).
async fn update_service(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path((slug, service_id)): Path<(String, Uuid)>,
    Json(body): Json<UpdateServiceBody>,
) -> Result<impl IntoResponse, AppError> {
    let center_id = resolve_center_and_check_membership(&state.pool, &slug, claims.sub).await?;

    if let Some(duration) = body.duration_minutes {
        if duration <= 0 {
            return Err(AppError::BadRequest(
                "Duration must be greater than 0".to_owned(),
            ));
        }
    }
    if let Some(capacity) = body.max_capacity {
        if capacity <= 0 {
            return Err(AppError::BadRequest(
                "Max capacity must be greater than 0".to_owned(),
            ));
        }
    }
    if let Some(price) = body.price {
        if price < Decimal::ZERO {
            return Err(AppError::BadRequest(
                "Price must be zero or positive".to_owned(),
            ));
        }
    }

    let result = sqlx::query(
        r#"
        UPDATE services
        SET name              = COALESCE($1, name),
            description       = COALESCE($2, description),
            category          = COALESCE($3, category),
            duration_minutes  = COALESCE($4, duration_minutes),
            max_capacity      = COALESCE($5, max_capacity),
            min_participants  = COALESCE($6, min_participants),
            price             = COALESCE($7, price),
            currency          = COALESCE($8, currency),
            min_certification = COALESCE($9, min_certification),
            min_dives         = COALESCE($10, min_dives),
            is_active         = COALESCE($11, is_active),
            updated_at        = NOW()
        WHERE id = $12 AND center_id = $13 AND deleted_at IS NULL
        "#,
    )
    .bind(body.name.as_deref().map(str::trim))
    .bind(body.description.as_deref().map(str::trim))
    .bind(body.category.as_deref().map(str::trim))
    .bind(body.duration_minutes)
    .bind(body.max_capacity)
    .bind(body.min_participants)
    .bind(body.price)
    .bind(body.currency.as_deref())
    .bind(body.min_certification.as_deref())
    .bind(body.min_dives)
    .bind(body.is_active)
    .bind(service_id)
    .bind(center_id)
    .execute(&state.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Service not found".to_owned()));
    }

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({ "message": "Service updated" })),
    ))
}

/// `DELETE /api/v1/centers/{slug}/services/{service_id}` — soft-delete a service.
async fn delete_service(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path((slug, service_id)): Path<(String, Uuid)>,
) -> Result<impl IntoResponse, AppError> {
    let center_id = resolve_center_and_check_membership(&state.pool, &slug, claims.sub).await?;

    let result = sqlx::query(
        "UPDATE services SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND center_id = $2 AND deleted_at IS NULL",
    )
    .bind(service_id)
    .bind(center_id)
    .execute(&state.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Service not found".to_owned()));
    }

    Ok(StatusCode::NO_CONTENT)
}

// ──────────────────────── Booking / Review endpoints for center management ────────────────────────

/// Booking row for center management view.
#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct CenterBookingRow {
    id: Uuid,
    client_id: Uuid,
    service_id: Option<Uuid>,
    status: String,
    booking_date: chrono::NaiveDate,
    participants: i32,
    total_price: Decimal,
    currency: String,
    client_note: Option<String>,
    created_at: chrono::DateTime<chrono::Utc>,
    client_display_name: Option<String>,
    service_name: Option<String>,
}

/// `GET /api/v1/centers/{slug}/bookings` — list bookings for a center (center member).
async fn list_center_bookings(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(slug): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let center_id = resolve_center_and_check_membership(&state.pool, &slug, claims.sub).await?;

    let bookings = sqlx::query_as::<_, CenterBookingRow>(
        r#"
        SELECT b.id, b.client_id, b.service_id, b.status::text AS status,
               b.booking_date, b.participants, b.total_price, b.currency,
               b.client_note, b.created_at,
               p.display_name AS client_display_name,
               s.name AS service_name
        FROM bookings b
        LEFT JOIN profiles p ON p.id = b.client_id AND p.deleted_at IS NULL
        LEFT JOIN services s ON s.id = b.service_id AND s.deleted_at IS NULL
        WHERE b.center_id = $1 AND b.deleted_at IS NULL
        ORDER BY b.booking_date DESC
        LIMIT 200
        "#,
    )
    .bind(center_id)
    .fetch_all(&state.pool)
    .await?;

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({ "data": bookings })),
    ))
}

/// Review row for center management view.
#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct CenterReviewRow {
    id: Uuid,
    client_id: Uuid,
    rating: i32,
    comment: Option<String>,
    reply: Option<String>,
    replied_at: Option<chrono::DateTime<chrono::Utc>>,
    is_published: Option<bool>,
    created_at: chrono::DateTime<chrono::Utc>,
    client_display_name: Option<String>,
}

/// `GET /api/v1/centers/{slug}/reviews` — list reviews for a center (center member).
async fn list_center_reviews(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(slug): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let center_id = resolve_center_and_check_membership(&state.pool, &slug, claims.sub).await?;

    let reviews = sqlx::query_as::<_, CenterReviewRow>(
        r#"
        SELECT r.id, r.client_id, r.rating, r.comment, r.reply, r.replied_at,
               r.is_published, r.created_at,
               p.display_name AS client_display_name
        FROM reviews r
        LEFT JOIN profiles p ON p.id = r.client_id AND p.deleted_at IS NULL
        WHERE r.center_id = $1 AND r.deleted_at IS NULL
        ORDER BY r.created_at DESC
        LIMIT 200
        "#,
    )
    .bind(center_id)
    .fetch_all(&state.pool)
    .await?;

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({ "data": reviews })),
    ))
}

/// Body for replying to a review.
#[derive(Debug, Deserialize)]
struct ReplyToReviewBody {
    reply: String,
}

/// `POST /api/v1/centers/{slug}/reviews/{review_id}/reply` — reply to a review (center member).
async fn reply_to_review(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path((slug, review_id)): Path<(String, Uuid)>,
    Json(body): Json<ReplyToReviewBody>,
) -> Result<impl IntoResponse, AppError> {
    let center_id = resolve_center_and_check_membership(&state.pool, &slug, claims.sub).await?;

    let reply_text = body.reply.trim();
    if reply_text.is_empty() {
        return Err(AppError::BadRequest("Reply text is required".to_owned()));
    }

    let result = sqlx::query(
        r#"
        UPDATE reviews
        SET reply = $1, replied_at = NOW(), updated_at = NOW()
        WHERE id = $2 AND center_id = $3 AND deleted_at IS NULL
        "#,
    )
    .bind(reply_text)
    .bind(review_id)
    .bind(center_id)
    .execute(&state.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Review not found".to_owned()));
    }

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({ "message": "Reply saved" })),
    ))
}

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/centers/{slug}/services", get(list_services_by_center_slug).post(create_service))
        .route(
            "/centers/{slug}/services/{service_id}",
            axum::routing::patch(update_service).delete(delete_service),
        )
        .route("/centers/{slug}/bookings", get(list_center_bookings))
        .route("/centers/{slug}/reviews", get(list_center_reviews))
        .route(
            "/centers/{slug}/reviews/{review_id}/reply",
            axum::routing::post(reply_to_review),
        )
}
