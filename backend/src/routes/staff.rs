//! Staff routes: CRUD for center staff members + working hours.

use std::sync::Arc;

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::{get, patch};
use axum::{Json, Router};
use serde::Deserialize;
use uuid::Uuid;

use crate::error::AppError;
use crate::middleware::auth::{require_center_member, AuthUser};
use crate::AppState;

/// Resolve slug to center_id and verify membership.
async fn resolve_center(
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

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route(
            "/centers/{slug}/staff",
            get(list_staff).post(create_staff),
        )
        .route(
            "/centers/{slug}/staff/{staff_id}",
            get(get_staff_detail).patch(update_staff).delete(delete_staff),
        )
        .route(
            "/centers/{slug}/staff/{staff_id}/bio",
            patch(update_staff_bio),
        )
        .route(
            "/centers/{slug}/staff/{staff_id}/hours",
            get(get_staff_hours).put(set_staff_hours),
        )
}

// ──────────────────────── Types ────────────────────────

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct StaffRow {
    id: Uuid,
    center_id: Uuid,
    profile_id: Option<Uuid>,
    first_name: String,
    last_name: String,
    email: Option<String>,
    phone: Option<String>,
    role_label: String,
    bio: Option<String>,
    avatar_url: Option<String>,
    is_active: bool,
    created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct StaffHourRow {
    id: Uuid,
    staff_id: Uuid,
    day_of_week: i16,
    start_time: chrono::NaiveTime,
    end_time: chrono::NaiveTime,
}

// ──────────────────────── List ────────────────────────

/// `GET /api/v1/centers/{slug}/staff`
async fn list_staff(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(slug): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let center_id = resolve_center(&state.pool, &slug, claims.sub).await?;

    let rows = sqlx::query_as::<_, StaffRow>(
        r#"
        SELECT id, center_id, profile_id, first_name, last_name, email, phone,
               role_label, bio, avatar_url, is_active, created_at
        FROM staff
        WHERE center_id = $1 AND deleted_at IS NULL
        ORDER BY first_name ASC, last_name ASC
        "#,
    )
    .bind(center_id)
    .fetch_all(&state.pool)
    .await?;

    Ok((StatusCode::OK, Json(serde_json::json!({ "data": rows }))))
}

// ──────────────────────── Detail ────────────────────────

/// `GET /api/v1/centers/{slug}/staff/{staff_id}`
async fn get_staff_detail(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path((slug, staff_id)): Path<(String, Uuid)>,
) -> Result<impl IntoResponse, AppError> {
    let center_id = resolve_center(&state.pool, &slug, claims.sub).await?;

    let row = sqlx::query_as::<_, StaffRow>(
        r#"
        SELECT id, center_id, profile_id, first_name, last_name, email, phone,
               role_label, bio, avatar_url, is_active, created_at
        FROM staff
        WHERE id = $1 AND center_id = $2 AND deleted_at IS NULL
        "#,
    )
    .bind(staff_id)
    .bind(center_id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Staff member not found".to_owned()))?;

    Ok((StatusCode::OK, Json(serde_json::json!({ "data": row }))))
}

// ──────────────────────── Create ────────────────────────

#[derive(Debug, Deserialize)]
struct CreateStaffBody {
    first_name: String,
    last_name: String,
    email: Option<String>,
    phone: Option<String>,
    role_label: Option<String>,
    bio: Option<String>,
}

/// `POST /api/v1/centers/{slug}/staff`
async fn create_staff(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(slug): Path<String>,
    Json(body): Json<CreateStaffBody>,
) -> Result<impl IntoResponse, AppError> {
    let center_id = resolve_center(&state.pool, &slug, claims.sub).await?;

    let first = body.first_name.trim();
    let last = body.last_name.trim();
    if first.is_empty() || last.is_empty() {
        return Err(AppError::BadRequest(
            "First name and last name are required".to_owned(),
        ));
    }

    let id: Uuid = sqlx::query_scalar(
        r#"
        INSERT INTO staff (center_id, first_name, last_name, email, phone, role_label, bio)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
        "#,
    )
    .bind(center_id)
    .bind(first)
    .bind(last)
    .bind(body.email.as_deref().map(str::trim))
    .bind(body.phone.as_deref().map(str::trim))
    .bind(body.role_label.as_deref().unwrap_or("instructor"))
    .bind(body.bio.as_deref().map(str::trim))
    .fetch_one(&state.pool)
    .await?;

    Ok((
        StatusCode::CREATED,
        Json(serde_json::json!({ "data": { "id": id } })),
    ))
}

// ──────────────────────── Update ────────────────────────

#[derive(Debug, Deserialize)]
struct UpdateStaffBody {
    first_name: Option<String>,
    last_name: Option<String>,
    email: Option<String>,
    phone: Option<String>,
    role_label: Option<String>,
    is_active: Option<bool>,
}

/// `PATCH /api/v1/centers/{slug}/staff/{staff_id}`
async fn update_staff(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path((slug, staff_id)): Path<(String, Uuid)>,
    Json(body): Json<UpdateStaffBody>,
) -> Result<impl IntoResponse, AppError> {
    let center_id = resolve_center(&state.pool, &slug, claims.sub).await?;

    let result = sqlx::query(
        r#"
        UPDATE staff
        SET first_name = COALESCE($1, first_name),
            last_name  = COALESCE($2, last_name),
            email      = COALESCE($3, email),
            phone      = COALESCE($4, phone),
            role_label = COALESCE($5, role_label),
            is_active  = COALESCE($6, is_active),
            updated_at = NOW()
        WHERE id = $7 AND center_id = $8 AND deleted_at IS NULL
        "#,
    )
    .bind(body.first_name.as_deref().map(str::trim))
    .bind(body.last_name.as_deref().map(str::trim))
    .bind(body.email.as_deref().map(str::trim))
    .bind(body.phone.as_deref().map(str::trim))
    .bind(body.role_label.as_deref().map(str::trim))
    .bind(body.is_active)
    .bind(staff_id)
    .bind(center_id)
    .execute(&state.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Staff member not found".to_owned()));
    }

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({ "message": "Staff updated" })),
    ))
}

// ──────────────────────── Update Bio ────────────────────────

#[derive(Debug, Deserialize)]
struct UpdateBioBody {
    bio: String,
}

/// `PATCH /api/v1/centers/{slug}/staff/{staff_id}/bio`
async fn update_staff_bio(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path((slug, staff_id)): Path<(String, Uuid)>,
    Json(body): Json<UpdateBioBody>,
) -> Result<impl IntoResponse, AppError> {
    let center_id = resolve_center(&state.pool, &slug, claims.sub).await?;

    let result = sqlx::query(
        "UPDATE staff SET bio = $1, updated_at = NOW() WHERE id = $2 AND center_id = $3 AND deleted_at IS NULL",
    )
    .bind(body.bio.trim())
    .bind(staff_id)
    .bind(center_id)
    .execute(&state.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Staff member not found".to_owned()));
    }

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({ "message": "Bio updated" })),
    ))
}

// ──────────────────────── Delete ────────────────────────

/// `DELETE /api/v1/centers/{slug}/staff/{staff_id}`
async fn delete_staff(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path((slug, staff_id)): Path<(String, Uuid)>,
) -> Result<impl IntoResponse, AppError> {
    let center_id = resolve_center(&state.pool, &slug, claims.sub).await?;

    let result = sqlx::query(
        "UPDATE staff SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND center_id = $2 AND deleted_at IS NULL",
    )
    .bind(staff_id)
    .bind(center_id)
    .execute(&state.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Staff member not found".to_owned()));
    }

    Ok(StatusCode::NO_CONTENT)
}

// ──────────────────────── Staff Hours ────────────────────────

/// `GET /api/v1/centers/{slug}/staff/{staff_id}/hours`
async fn get_staff_hours(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path((slug, staff_id)): Path<(String, Uuid)>,
) -> Result<impl IntoResponse, AppError> {
    let center_id = resolve_center(&state.pool, &slug, claims.sub).await?;

    // Verify staff belongs to center
    let exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM staff WHERE id = $1 AND center_id = $2 AND deleted_at IS NULL)",
    )
    .bind(staff_id)
    .bind(center_id)
    .fetch_one(&state.pool)
    .await?;

    if !exists {
        return Err(AppError::NotFound("Staff member not found".to_owned()));
    }

    let hours = sqlx::query_as::<_, StaffHourRow>(
        "SELECT id, staff_id, day_of_week, start_time, end_time FROM staff_hours WHERE staff_id = $1 ORDER BY day_of_week ASC",
    )
    .bind(staff_id)
    .fetch_all(&state.pool)
    .await?;

    Ok((StatusCode::OK, Json(serde_json::json!({ "data": hours }))))
}

#[derive(Debug, Deserialize)]
struct DayHours {
    day_of_week: i16,
    start_time: String,
    end_time: String,
}

#[derive(Debug, Deserialize)]
struct SetStaffHoursBody {
    hours: Vec<DayHours>,
}

/// `PUT /api/v1/centers/{slug}/staff/{staff_id}/hours`
async fn set_staff_hours(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path((slug, staff_id)): Path<(String, Uuid)>,
    Json(body): Json<SetStaffHoursBody>,
) -> Result<impl IntoResponse, AppError> {
    let center_id = resolve_center(&state.pool, &slug, claims.sub).await?;

    let exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM staff WHERE id = $1 AND center_id = $2 AND deleted_at IS NULL)",
    )
    .bind(staff_id)
    .bind(center_id)
    .fetch_one(&state.pool)
    .await?;

    if !exists {
        return Err(AppError::NotFound("Staff member not found".to_owned()));
    }

    // Validate all entries
    for h in &body.hours {
        if !(0..=6).contains(&h.day_of_week) {
            return Err(AppError::BadRequest(
                "day_of_week must be between 0 and 6".to_owned(),
            ));
        }
        chrono::NaiveTime::parse_from_str(&h.start_time, "%H:%M")
            .map_err(|_| AppError::BadRequest("Invalid start_time format".to_owned()))?;
        chrono::NaiveTime::parse_from_str(&h.end_time, "%H:%M")
            .map_err(|_| AppError::BadRequest("Invalid end_time format".to_owned()))?;
    }

    // Replace all hours: delete old, insert new in a transaction
    let mut tx = state.pool.begin().await?;

    sqlx::query("DELETE FROM staff_hours WHERE staff_id = $1")
        .bind(staff_id)
        .execute(&mut *tx)
        .await?;

    for h in &body.hours {
        let start = chrono::NaiveTime::parse_from_str(&h.start_time, "%H:%M")
            .map_err(|_| AppError::BadRequest("Invalid start_time".to_owned()))?;
        let end = chrono::NaiveTime::parse_from_str(&h.end_time, "%H:%M")
            .map_err(|_| AppError::BadRequest("Invalid end_time".to_owned()))?;

        sqlx::query(
            "INSERT INTO staff_hours (staff_id, day_of_week, start_time, end_time) VALUES ($1, $2, $3, $4) ON CONFLICT (staff_id, day_of_week) DO UPDATE SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time",
        )
        .bind(staff_id)
        .bind(h.day_of_week)
        .bind(start)
        .bind(end)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({ "message": "Staff hours updated" })),
    ))
}
