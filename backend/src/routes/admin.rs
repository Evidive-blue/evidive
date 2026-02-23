use std::sync::Arc;

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::{delete, get, patch};
use axum::{Json, Router};
use rust_decimal::Decimal;
use serde::Deserialize;
use uuid::Uuid;

use crate::error::AppError;
use crate::middleware::auth::{require_admin, AuthUser};
use crate::AppState;

/// Build the `/admin` sub-router. All routes require admin_diver role.
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/stats", get(get_stats))
        .route("/centers", get(list_all_centers))
        .route("/centers/pending", get(list_pending_centers))
        .route("/centers/{center_id}/status", patch(update_center_status))
        .route("/users", get(list_all_users))
        .route("/users/{user_id}/role", patch(update_user_role))
        .route("/bookings", get(list_all_bookings))
        .route("/bookings/{booking_id}/status", patch(update_booking_status))
        .route("/reviews", get(list_all_reviews))
        .route("/reviews/{review_id}/publish", patch(toggle_review_publish))
        .route("/reviews/{review_id}", delete(soft_delete_review))
        .nest("/settings", super::admin_settings::router())
        .merge(super::admin_advanced::router())
}

// ──────────────────────── Stats ────────────────────────

#[derive(Debug, serde::Serialize)]
struct AdminStats {
    pending_centers: i64,
    active_centers: i64,
    total_users: i64,
    total_bookings: i64,
    total_reviews: i64,
}

/// `GET /api/v1/admin/stats`
async fn get_stats(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;

    let row = sqlx::query_as::<_, (i64, i64, i64, i64, i64)>(
        r#"
        SELECT
            (SELECT COUNT(*) FROM centers WHERE status = 'pending' AND deleted_at IS NULL),
            (SELECT COUNT(*) FROM centers WHERE status = 'active' AND deleted_at IS NULL),
            (SELECT COUNT(*) FROM profiles WHERE deleted_at IS NULL),
            (SELECT COUNT(*) FROM bookings WHERE deleted_at IS NULL),
            (SELECT COUNT(*) FROM reviews WHERE deleted_at IS NULL)
        "#,
    )
    .fetch_one(&state.pool)
    .await?;

    let stats = AdminStats {
        pending_centers: row.0,
        active_centers: row.1,
        total_users: row.2,
        total_bookings: row.3,
        total_reviews: row.4,
    };

    Ok((StatusCode::OK, Json(serde_json::json!({ "data": stats }))))
}

// ──────────────────────── Centers ────────────────────────

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct AdminCenterRow {
    id: Uuid,
    name: String,
    slug: String,
    email: String,
    country: String,
    city: Option<String>,
    status: String,
    owner_display_name: Option<String>,
    created_at: chrono::DateTime<chrono::Utc>,
}

/// `GET /api/v1/admin/centers` — all centers, any status.
async fn list_all_centers(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;

    let rows = sqlx::query_as::<_, AdminCenterRow>(
        r#"
        SELECT c.id, c.name, c.slug, c.email, c.country, c.city,
               c.status::text AS status, p.display_name AS owner_display_name,
               c.created_at
        FROM centers c
        LEFT JOIN profiles p ON p.id = c.owner_id AND p.deleted_at IS NULL
        WHERE c.deleted_at IS NULL
        ORDER BY c.created_at DESC
        LIMIT 500
        "#,
    )
    .fetch_all(&state.pool)
    .await?;

    Ok((StatusCode::OK, Json(serde_json::json!({ "data": rows }))))
}

/// Lightweight pending center projection for admin review (kept for compatibility).
#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct PendingCenter {
    id: Uuid,
    name: String,
    slug: String,
    email: String,
    country: String,
    city: Option<String>,
    status: String,
    created_at: chrono::DateTime<chrono::Utc>,
}

/// `GET /api/v1/admin/centers/pending`
async fn list_pending_centers(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;

    let centers: Vec<PendingCenter> = sqlx::query_as::<_, PendingCenter>(
        r#"
        SELECT id, name, slug, email, country, city, status::text AS status, created_at
        FROM centers
        WHERE status = 'pending' AND deleted_at IS NULL
        ORDER BY created_at ASC
        LIMIT 100
        "#,
    )
    .fetch_all(&state.pool)
    .await?;

    Ok((StatusCode::OK, Json(serde_json::json!({ "data": centers }))))
}

/// Valid status transitions an admin can apply to a center.
#[derive(Debug, Deserialize)]
struct UpdateCenterStatusBody {
    status: CenterStatusAction,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
enum CenterStatusAction {
    Active,
    Rejected,
    Suspended,
    Inactive,
}

impl CenterStatusAction {
    fn as_str(&self) -> &'static str {
        match self {
            Self::Active => "active",
            Self::Rejected => "rejected",
            Self::Suspended => "suspended",
            Self::Inactive => "inactive",
        }
    }
}

/// `PATCH /api/v1/admin/centers/{center_id}/status`
async fn update_center_status(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(center_id): Path<Uuid>,
    Json(body): Json<UpdateCenterStatusBody>,
) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;

    let result = sqlx::query(
        r#"
        UPDATE centers
        SET status = $1::center_status, updated_at = NOW()
        WHERE id = $2 AND deleted_at IS NULL
        "#,
    )
    .bind(body.status.as_str())
    .bind(center_id)
    .execute(&state.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!(
            "Center {center_id} not found"
        )));
    }

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({
            "message": "Center status updated",
            "status": body.status.as_str()
        })),
    ))
}

// ──────────────────────── Users ────────────────────────

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct AdminUserRow {
    id: Uuid,
    display_name: Option<String>,
    first_name: Option<String>,
    last_name: Option<String>,
    role: String,
    created_at: chrono::DateTime<chrono::Utc>,
}

/// `GET /api/v1/admin/users`
async fn list_all_users(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;

    let rows = sqlx::query_as::<_, AdminUserRow>(
        r#"
        SELECT id, display_name, first_name, last_name,
               role::text AS role, created_at
        FROM profiles
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 500
        "#,
    )
    .fetch_all(&state.pool)
    .await?;

    Ok((StatusCode::OK, Json(serde_json::json!({ "data": rows }))))
}

#[derive(Debug, Deserialize)]
struct UpdateUserRoleBody {
    role: UserRoleAction,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
enum UserRoleAction {
    Diver,
    AdminDiver,
}

impl UserRoleAction {
    fn as_str(&self) -> &'static str {
        match self {
            Self::Diver => "diver",
            Self::AdminDiver => "admin_diver",
        }
    }
}

/// `PATCH /api/v1/admin/users/{user_id}/role`
async fn update_user_role(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(user_id): Path<Uuid>,
    Json(body): Json<UpdateUserRoleBody>,
) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;

    // Prevent admin from removing their own admin role
    if user_id == claims.sub && matches!(body.role, UserRoleAction::Diver) {
        return Err(AppError::BadRequest(
            "Cannot remove your own admin role".to_owned(),
        ));
    }

    let result = sqlx::query(
        r#"
        UPDATE profiles
        SET role = $1::user_role, updated_at = NOW()
        WHERE id = $2 AND deleted_at IS NULL
        "#,
    )
    .bind(body.role.as_str())
    .bind(user_id)
    .execute(&state.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!(
            "User {user_id} not found"
        )));
    }

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({
            "message": "User role updated",
            "role": body.role.as_str()
        })),
    ))
}

// ──────────────────────── Bookings ────────────────────────

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct AdminBookingRow {
    id: Uuid,
    client_display_name: Option<String>,
    center_name: Option<String>,
    service_name: Option<String>,
    booking_date: chrono::NaiveDate,
    participants: i32,
    total_price: Decimal,
    currency: String,
    status: String,
    created_at: chrono::DateTime<chrono::Utc>,
}

/// `GET /api/v1/admin/bookings`
async fn list_all_bookings(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;

    let rows = sqlx::query_as::<_, AdminBookingRow>(
        r#"
        SELECT b.id, p.display_name AS client_display_name,
               c.name AS center_name, s.name AS service_name,
               b.booking_date, b.participants, b.total_price, b.currency,
               b.status::text AS status, b.created_at
        FROM bookings b
        LEFT JOIN profiles p ON p.id = b.client_id AND p.deleted_at IS NULL
        LEFT JOIN centers c ON c.id = b.center_id AND c.deleted_at IS NULL
        LEFT JOIN services s ON s.id = b.service_id AND s.deleted_at IS NULL
        WHERE b.deleted_at IS NULL
        ORDER BY b.created_at DESC
        LIMIT 500
        "#,
    )
    .fetch_all(&state.pool)
    .await?;

    Ok((StatusCode::OK, Json(serde_json::json!({ "data": rows }))))
}

#[derive(Debug, Deserialize)]
struct UpdateBookingStatusBody {
    status: BookingStatusAction,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "snake_case")]
enum BookingStatusAction {
    Confirmed,
    Cancelled,
    Completed,
    Noshow,
}

impl BookingStatusAction {
    fn as_str(&self) -> &'static str {
        match self {
            Self::Confirmed => "confirmed",
            Self::Cancelled => "cancelled",
            Self::Completed => "completed",
            Self::Noshow => "noshow",
        }
    }
}

/// `PATCH /api/v1/admin/bookings/{booking_id}/status`
async fn update_booking_status(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(booking_id): Path<Uuid>,
    Json(body): Json<UpdateBookingStatusBody>,
) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;

    let result = sqlx::query(
        r#"
        UPDATE bookings
        SET status = $1::booking_status, updated_at = NOW()
        WHERE id = $2 AND deleted_at IS NULL
        "#,
    )
    .bind(body.status.as_str())
    .bind(booking_id)
    .execute(&state.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!(
            "Booking {booking_id} not found"
        )));
    }

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({
            "message": "Booking status updated",
            "status": body.status.as_str()
        })),
    ))
}

// ──────────────────────── Reviews ────────────────────────

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct AdminReviewRow {
    id: Uuid,
    client_display_name: Option<String>,
    center_name: Option<String>,
    rating: i32,
    comment: Option<String>,
    reply: Option<String>,
    is_published: Option<bool>,
    created_at: chrono::DateTime<chrono::Utc>,
}

/// `GET /api/v1/admin/reviews`
async fn list_all_reviews(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;

    let rows = sqlx::query_as::<_, AdminReviewRow>(
        r#"
        SELECT r.id, p.display_name AS client_display_name,
               c.name AS center_name, r.rating, r.comment, r.reply,
               r.is_published, r.created_at
        FROM reviews r
        LEFT JOIN profiles p ON p.id = r.client_id AND p.deleted_at IS NULL
        LEFT JOIN centers c ON c.id = r.center_id AND c.deleted_at IS NULL
        WHERE r.deleted_at IS NULL
        ORDER BY r.created_at DESC
        LIMIT 500
        "#,
    )
    .fetch_all(&state.pool)
    .await?;

    Ok((StatusCode::OK, Json(serde_json::json!({ "data": rows }))))
}

#[derive(Debug, Deserialize)]
struct TogglePublishBody {
    is_published: bool,
}

/// `PATCH /api/v1/admin/reviews/{review_id}/publish`
async fn toggle_review_publish(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(review_id): Path<Uuid>,
    Json(body): Json<TogglePublishBody>,
) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;

    let result = sqlx::query(
        r#"
        UPDATE reviews
        SET is_published = $1, updated_at = NOW()
        WHERE id = $2 AND deleted_at IS NULL
        "#,
    )
    .bind(body.is_published)
    .bind(review_id)
    .execute(&state.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!(
            "Review {review_id} not found"
        )));
    }

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({
            "message": "Review publish status updated",
            "is_published": body.is_published
        })),
    ))
}

/// `DELETE /api/v1/admin/reviews/{review_id}` — soft delete.
async fn soft_delete_review(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(review_id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;

    let result = sqlx::query(
        r#"
        UPDATE reviews
        SET deleted_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND deleted_at IS NULL
        "#,
    )
    .bind(review_id)
    .execute(&state.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!(
            "Review {review_id} not found"
        )));
    }

    Ok(StatusCode::NO_CONTENT)
}
