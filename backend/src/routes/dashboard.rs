//! Dashboard routes for center owners: KPIs, calendar, blocked dates, holidays.

use std::sync::Arc;

use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::{delete, get};
use axum::{Json, Router};
use rust_decimal::Decimal;
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
        .route("/centers/{slug}/kpis", get(get_kpis))
        .route("/centers/{slug}/calendar", get(get_calendar))
        .route(
            "/centers/{slug}/blocked-dates",
            get(list_blocked_dates).post(create_blocked_date),
        )
        .route(
            "/centers/{slug}/blocked-dates/{date_id}",
            delete(delete_blocked_date),
        )
        .route(
            "/centers/{slug}/holidays",
            get(list_holidays).post(create_holiday),
        )
        .route(
            "/centers/{slug}/holidays/{holiday_id}",
            delete(delete_holiday),
        )
}

// ──────────────────────── KPIs ────────────────────────

#[derive(Debug, serde::Serialize)]
struct CenterKpis {
    total_bookings: i64,
    pending_bookings: i64,
    confirmed_bookings: i64,
    completed_bookings: i64,
    cancelled_bookings: i64,
    total_revenue: Decimal,
    total_commission: Decimal,
    net_revenue: Decimal,
    average_rating: Option<f64>,
    total_reviews: i64,
    active_services: i64,
    currency: String,
}

/// `GET /api/v1/centers/{slug}/kpis`
async fn get_kpis(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(slug): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let center_id = resolve_center(&state.pool, &slug, claims.sub).await?;

    let booking_stats = sqlx::query_as::<_, (i64, i64, i64, i64, i64)>(
        r#"
        SELECT
            COUNT(*),
            COUNT(*) FILTER (WHERE status = 'pending'),
            COUNT(*) FILTER (WHERE status = 'confirmed'),
            COUNT(*) FILTER (WHERE status = 'completed'),
            COUNT(*) FILTER (WHERE status = 'cancelled')
        FROM bookings WHERE center_id = $1 AND deleted_at IS NULL
        "#,
    )
    .bind(center_id)
    .fetch_one(&state.pool)
    .await?;

    let revenue = sqlx::query_as::<_, (Option<Decimal>, Option<Decimal>)>(
        r#"
        SELECT
            SUM(total_price),
            SUM(commission_amount)
        FROM bookings
        WHERE center_id = $1 AND status IN ('confirmed', 'completed') AND deleted_at IS NULL
        "#,
    )
    .bind(center_id)
    .fetch_one(&state.pool)
    .await?;

    let total_revenue = revenue.0.unwrap_or(Decimal::ZERO);
    let total_commission = revenue.1.unwrap_or(Decimal::ZERO);

    let review_stats = sqlx::query_as::<_, (Option<f64>, i64)>(
        r#"
        SELECT AVG(rating::float), COUNT(*)
        FROM reviews WHERE center_id = $1 AND is_published = true AND deleted_at IS NULL
        "#,
    )
    .bind(center_id)
    .fetch_one(&state.pool)
    .await?;

    let active_services: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM services WHERE center_id = $1 AND is_active = true AND deleted_at IS NULL",
    )
    .bind(center_id)
    .fetch_one(&state.pool)
    .await?;

    let currency: String = sqlx::query_scalar(
        "SELECT COALESCE(currency, 'EUR') FROM centers WHERE id = $1",
    )
    .bind(center_id)
    .fetch_one(&state.pool)
    .await?;

    let kpis = CenterKpis {
        total_bookings: booking_stats.0,
        pending_bookings: booking_stats.1,
        confirmed_bookings: booking_stats.2,
        completed_bookings: booking_stats.3,
        cancelled_bookings: booking_stats.4,
        total_revenue,
        total_commission,
        net_revenue: total_revenue - total_commission,
        average_rating: review_stats.0,
        total_reviews: review_stats.1,
        active_services,
        currency,
    };

    Ok((StatusCode::OK, Json(serde_json::json!({ "data": kpis }))))
}

// ──────────────────────── Calendar ────────────────────────

#[derive(Debug, Deserialize)]
struct CalendarQuery {
    date_from: Option<String>,
    date_to: Option<String>,
}

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct CalendarEvent {
    id: Uuid,
    booking_date: chrono::NaiveDate,
    time_slot: chrono::NaiveTime,
    participants: i32,
    status: String,
    client_display_name: Option<String>,
    service_name: Option<String>,
}

/// `GET /api/v1/centers/{slug}/calendar`
async fn get_calendar(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(slug): Path<String>,
    Query(params): Query<CalendarQuery>,
) -> Result<impl IntoResponse, AppError> {
    let center_id = resolve_center(&state.pool, &slug, claims.sub).await?;

    let today = chrono::Utc::now().date_naive();
    let date_from = params
        .date_from
        .as_deref()
        .and_then(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok())
        .unwrap_or(today);
    let date_to = params
        .date_to
        .as_deref()
        .and_then(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok())
        .unwrap_or(today + chrono::Duration::days(30));

    let events = sqlx::query_as::<_, CalendarEvent>(
        r#"
        SELECT b.id, b.booking_date, b.time_slot, b.participants,
               b.status::text AS status,
               p.display_name AS client_display_name,
               s.name AS service_name
        FROM bookings b
        LEFT JOIN profiles p ON p.id = b.client_id AND p.deleted_at IS NULL
        LEFT JOIN services s ON s.id = b.service_id AND s.deleted_at IS NULL
        WHERE b.center_id = $1
          AND b.booking_date BETWEEN $2 AND $3
          AND b.status NOT IN ('cancelled')
          AND b.deleted_at IS NULL
        ORDER BY b.booking_date ASC, b.time_slot ASC
        LIMIT 500
        "#,
    )
    .bind(center_id)
    .bind(date_from)
    .bind(date_to)
    .fetch_all(&state.pool)
    .await?;

    Ok((StatusCode::OK, Json(serde_json::json!({ "data": events }))))
}

// ──────────────────────── Blocked Dates ────────────────────────

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct BlockedDateRow {
    id: Uuid,
    blocked_date: chrono::NaiveDate,
    reason: Option<String>,
    created_at: chrono::DateTime<chrono::Utc>,
}

/// `GET /api/v1/centers/{slug}/blocked-dates`
async fn list_blocked_dates(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(slug): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let center_id = resolve_center(&state.pool, &slug, claims.sub).await?;

    let rows = sqlx::query_as::<_, BlockedDateRow>(
        "SELECT id, blocked_date, reason, created_at FROM blocked_dates WHERE center_id = $1 ORDER BY blocked_date ASC",
    )
    .bind(center_id)
    .fetch_all(&state.pool)
    .await?;

    Ok((StatusCode::OK, Json(serde_json::json!({ "data": rows }))))
}

#[derive(Debug, Deserialize)]
struct CreateBlockedDateBody {
    /// Accepts either `blocked_date` or `start_date` (frontend compatibility)
    blocked_date: Option<String>,
    start_date: Option<String>,
    #[allow(dead_code)]
    end_date: Option<String>,
    reason: Option<String>,
}

/// `POST /api/v1/centers/{slug}/blocked-dates`
async fn create_blocked_date(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(slug): Path<String>,
    Json(body): Json<CreateBlockedDateBody>,
) -> Result<impl IntoResponse, AppError> {
    let center_id = resolve_center(&state.pool, &slug, claims.sub).await?;

    let date_str = body
        .blocked_date
        .as_deref()
        .or(body.start_date.as_deref())
        .ok_or_else(|| AppError::BadRequest("blocked_date or start_date required".to_owned()))?;
    let date = chrono::NaiveDate::parse_from_str(date_str, "%Y-%m-%d")
        .map_err(|_| AppError::BadRequest("Invalid date format".to_owned()))?;

    let id: Uuid = sqlx::query_scalar(
        "INSERT INTO blocked_dates (center_id, blocked_date, reason) VALUES ($1, $2, $3) ON CONFLICT (center_id, blocked_date) DO NOTHING RETURNING id",
    )
    .bind(center_id)
    .bind(date)
    .bind(body.reason.as_deref().map(str::trim))
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::Conflict("This date is already blocked".to_owned()))?;

    Ok((
        StatusCode::CREATED,
        Json(serde_json::json!({ "data": { "id": id } })),
    ))
}

/// `DELETE /api/v1/centers/{slug}/blocked-dates/{date_id}`
async fn delete_blocked_date(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path((slug, date_id)): Path<(String, Uuid)>,
) -> Result<impl IntoResponse, AppError> {
    let center_id = resolve_center(&state.pool, &slug, claims.sub).await?;

    let result =
        sqlx::query("DELETE FROM blocked_dates WHERE id = $1 AND center_id = $2")
            .bind(date_id)
            .bind(center_id)
            .execute(&state.pool)
            .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Blocked date not found".to_owned()));
    }

    Ok(StatusCode::NO_CONTENT)
}

// ──────────────────────── Holidays ────────────────────────

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct HolidayRow {
    id: Uuid,
    staff_id: Option<Uuid>,
    title: String,
    start_date: chrono::NaiveDate,
    end_date: chrono::NaiveDate,
    created_at: chrono::DateTime<chrono::Utc>,
}

/// `GET /api/v1/centers/{slug}/holidays`
async fn list_holidays(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(slug): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let center_id = resolve_center(&state.pool, &slug, claims.sub).await?;

    let rows = sqlx::query_as::<_, HolidayRow>(
        "SELECT id, staff_id, title, start_date, end_date, created_at FROM holidays WHERE center_id = $1 ORDER BY start_date ASC",
    )
    .bind(center_id)
    .fetch_all(&state.pool)
    .await?;

    Ok((StatusCode::OK, Json(serde_json::json!({ "data": rows }))))
}

#[derive(Debug, Deserialize)]
struct CreateHolidayBody {
    staff_id: Option<Uuid>,
    #[allow(dead_code)]
    user_id: Option<Uuid>,
    title: Option<String>,
    reason: Option<String>,
    start_date: String,
    end_date: String,
}

/// `POST /api/v1/centers/{slug}/holidays`
async fn create_holiday(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(slug): Path<String>,
    Json(body): Json<CreateHolidayBody>,
) -> Result<impl IntoResponse, AppError> {
    let center_id = resolve_center(&state.pool, &slug, claims.sub).await?;

    let start = chrono::NaiveDate::parse_from_str(&body.start_date, "%Y-%m-%d")
        .map_err(|_| AppError::BadRequest("Invalid start_date".to_owned()))?;
    let end = chrono::NaiveDate::parse_from_str(&body.end_date, "%Y-%m-%d")
        .map_err(|_| AppError::BadRequest("Invalid end_date".to_owned()))?;

    if end < start {
        return Err(AppError::BadRequest(
            "end_date must be >= start_date".to_owned(),
        ));
    }

    // Accept title or reason as the label (frontend sends reason)
    let title = body
        .title
        .as_deref()
        .or(body.reason.as_deref())
        .map(str::trim)
        .unwrap_or("Holiday");

    let id: Uuid = sqlx::query_scalar(
        "INSERT INTO holidays (center_id, staff_id, title, start_date, end_date) VALUES ($1, $2, $3, $4, $5) RETURNING id",
    )
    .bind(center_id)
    .bind(body.staff_id)
    .bind(title)
    .bind(start)
    .bind(end)
    .fetch_one(&state.pool)
    .await?;

    Ok((
        StatusCode::CREATED,
        Json(serde_json::json!({ "data": { "id": id } })),
    ))
}

/// `DELETE /api/v1/centers/{slug}/holidays/{holiday_id}`
async fn delete_holiday(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path((slug, holiday_id)): Path<(String, Uuid)>,
) -> Result<impl IntoResponse, AppError> {
    let center_id = resolve_center(&state.pool, &slug, claims.sub).await?;

    let result =
        sqlx::query("DELETE FROM holidays WHERE id = $1 AND center_id = $2")
            .bind(holiday_id)
            .bind(center_id)
            .execute(&state.pool)
            .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Holiday not found".to_owned()));
    }

    Ok(StatusCode::NO_CONTENT)
}
