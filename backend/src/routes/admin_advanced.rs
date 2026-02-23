//! Advanced admin routes: users CRUD, services admin, tags, locations, extras,
//! notifications, coupons, vendors, refunds, reports, plannings, settings categories.

use std::sync::Arc;

use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::{delete, get, patch, post};
use axum::{Json, Router};
use rust_decimal::Decimal;
use serde::Deserialize;
use uuid::Uuid;

use crate::error::AppError;
use crate::middleware::auth::{require_admin, AuthUser};
use crate::AppState;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        // Users advanced
        .route("/users/{user_id}", get(get_user).patch(update_user).delete(delete_user))
        .route("/users/{user_id}/blacklist", post(blacklist_user))
        .route("/users/{user_id}/unblacklist", post(unblacklist_user))
        // Services admin
        .route("/services", get(list_all_services))
        .route("/services/{service_id}", delete(delete_service_admin))
        // Reviews approve
        .route("/reviews/{review_id}/approve", post(approve_review))
        // Centers update (admin)
        .route("/centers/{center_id}", patch(update_center_admin))
        // Tags
        .route("/tags", get(list_tags).post(create_tag))
        .route("/tags/{tag_id}", delete(delete_tag))
        // Locations
        .route("/locations", get(list_locations).post(create_location))
        .route("/locations/{location_id}", patch(update_location).delete(delete_location))
        // Service extras
        .route("/extras", get(list_extras).post(create_extra))
        .route("/extras/{extra_id}", patch(update_extra).delete(delete_extra))
        // Coupons
        .route("/coupons", get(list_coupons).post(create_coupon))
        .route("/coupons/{coupon_id}", patch(update_coupon).delete(delete_coupon))
        .route("/coupon-sources", get(list_coupon_sources))
        .route("/coupon-sources/{source_id}", patch(update_coupon_source))
        // Notifications
        .route("/notifications", get(list_notifications))
        .route("/notifications/read-all", post(mark_all_notifications_read))
        .route("/notifications/{notif_id}/read", post(mark_notification_read))
        // Vendors
        .route("/vendors", get(list_vendors))
        .route("/vendors/{vendor_id}/commission", patch(update_vendor_commission))
        .route("/vendors/{vendor_id}/suspend", post(suspend_vendor))
        .route("/vendors/{vendor_id}/activate", post(activate_vendor))
        // Commissions
        .route("/commissions", get(list_commissions))
        .route("/commissions/config", get(get_commission_config).put(update_commission_config))
        .route("/commissions/{commission_id}/pay", post(mark_commission_paid))
        .route("/commissions/bulk-pay", post(bulk_pay_commissions))
        // Payments
        .route("/payments", get(list_payments))
        // Refunds
        .route("/refunds", get(list_refunds))
        .route("/refunds/{refund_id}/approve", post(approve_refund))
        .route("/refunds/{refund_id}/reject", post(reject_refund))
        // Reports
        .route("/reports", get(get_reports))
        // Plannings
        .route("/plannings", get(get_plannings))
        // Settings categories
        .route("/settings/marketplace", get(get_settings_by_cat).put(update_settings_by_cat))
        .route("/settings/company", get(get_settings_by_cat).put(update_settings_by_cat))
        .route("/settings/currency", get(get_settings_by_cat).put(update_settings_by_cat))
        .route("/settings/display", get(get_settings_by_cat).put(update_settings_by_cat))
        .route("/settings/global", get(get_settings_by_cat).put(update_settings_by_cat))
}

// ═══════════════════════════════════════════════════════════
//  USERS ADVANCED
// ═══════════════════════════════════════════════════════════

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct UserDetail {
    id: Uuid,
    role: String,
    first_name: Option<String>,
    last_name: Option<String>,
    display_name: Option<String>,
    avatar_url: Option<String>,
    phone: Option<String>,
    preferred_locale: Option<String>,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
}

async fn get_user(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(user_id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    let user = sqlx::query_as::<_, UserDetail>(
        "SELECT id, role::text AS role, first_name, last_name, display_name, avatar_url, phone, preferred_locale, created_at, updated_at FROM profiles WHERE id = $1 AND deleted_at IS NULL",
    )
    .bind(user_id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound("User not found".to_owned()))?;
    Ok((StatusCode::OK, Json(serde_json::json!({ "data": user }))))
}

#[derive(Debug, Deserialize)]
struct UpdateUserBody {
    first_name: Option<String>,
    last_name: Option<String>,
    display_name: Option<String>,
    phone: Option<String>,
    role: Option<String>,
}

async fn update_user(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(user_id): Path<Uuid>,
    Json(body): Json<UpdateUserBody>,
) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    let result = sqlx::query(
        r#"UPDATE profiles SET
            first_name = COALESCE($1, first_name),
            last_name = COALESCE($2, last_name),
            display_name = COALESCE($3, display_name),
            phone = COALESCE($4, phone),
            role = COALESCE($5::user_role, role),
            updated_at = NOW()
        WHERE id = $6 AND deleted_at IS NULL"#,
    )
    .bind(body.first_name.as_deref())
    .bind(body.last_name.as_deref())
    .bind(body.display_name.as_deref())
    .bind(body.phone.as_deref())
    .bind(body.role.as_deref())
    .bind(user_id)
    .execute(&state.pool)
    .await?;
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("User not found".to_owned()));
    }
    Ok((StatusCode::OK, Json(serde_json::json!({ "message": "User updated" }))))
}

async fn delete_user(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(user_id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    if user_id == claims.sub {
        return Err(AppError::BadRequest("Cannot delete yourself".to_owned()));
    }
    sqlx::query("UPDATE profiles SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL")
        .bind(user_id)
        .execute(&state.pool)
        .await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn blacklist_user(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(user_id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    // Soft-delete = blacklist for now
    sqlx::query("UPDATE profiles SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL")
        .bind(user_id)
        .execute(&state.pool)
        .await?;
    Ok((StatusCode::OK, Json(serde_json::json!({ "message": "User blacklisted" }))))
}

async fn unblacklist_user(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(user_id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    sqlx::query("UPDATE profiles SET deleted_at = NULL, updated_at = NOW() WHERE id = $1")
        .bind(user_id)
        .execute(&state.pool)
        .await?;
    Ok((StatusCode::OK, Json(serde_json::json!({ "message": "User unblacklisted" }))))
}

// ═══════════════════════════════════════════════════════════
//  SERVICES ADMIN
// ═══════════════════════════════════════════════════════════

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct AdminServiceRow {
    id: Uuid,
    name: String,
    center_name: Option<String>,
    category: Option<String>,
    price: Decimal,
    currency: Option<String>,
    is_active: Option<bool>,
    created_at: chrono::DateTime<chrono::Utc>,
}

async fn list_all_services(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    let rows = sqlx::query_as::<_, AdminServiceRow>(
        r#"SELECT s.id, s.name, c.name AS center_name, s.category, s.price, s.currency,
                  s.is_active, s.created_at
           FROM services s
           LEFT JOIN centers c ON c.id = s.center_id AND c.deleted_at IS NULL
           WHERE s.deleted_at IS NULL
           ORDER BY s.created_at DESC LIMIT 500"#,
    )
    .fetch_all(&state.pool)
    .await?;
    Ok((StatusCode::OK, Json(serde_json::json!({ "data": rows }))))
}

async fn delete_service_admin(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(service_id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    sqlx::query("UPDATE services SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL")
        .bind(service_id)
        .execute(&state.pool)
        .await?;
    Ok(StatusCode::NO_CONTENT)
}

// ═══════════════════════════════════════════════════════════
//  REVIEWS APPROVE
// ═══════════════════════════════════════════════════════════

async fn approve_review(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(review_id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    sqlx::query("UPDATE reviews SET is_published = true, updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL")
        .bind(review_id)
        .execute(&state.pool)
        .await?;
    Ok((StatusCode::OK, Json(serde_json::json!({ "message": "Review approved" }))))
}

// ═══════════════════════════════════════════════════════════
//  CENTER UPDATE (ADMIN)
// ═══════════════════════════════════════════════════════════

#[derive(Debug, Deserialize)]
struct AdminUpdateCenterBody {
    name: Option<String>,
    email: Option<String>,
    phone: Option<String>,
    city: Option<String>,
    country: Option<String>,
    description: Option<String>,
    is_featured: Option<bool>,
}

async fn update_center_admin(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(center_id): Path<Uuid>,
    Json(body): Json<AdminUpdateCenterBody>,
) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    let result = sqlx::query(
        r#"UPDATE centers SET
            name = COALESCE($1, name), email = COALESCE($2, email),
            phone = COALESCE($3, phone), city = COALESCE($4, city),
            country = COALESCE($5, country), description = COALESCE($6, description),
            is_featured = COALESCE($7, is_featured), updated_at = NOW()
        WHERE id = $8 AND deleted_at IS NULL"#,
    )
    .bind(body.name.as_deref())
    .bind(body.email.as_deref())
    .bind(body.phone.as_deref())
    .bind(body.city.as_deref())
    .bind(body.country.as_deref())
    .bind(body.description.as_deref())
    .bind(body.is_featured)
    .bind(center_id)
    .execute(&state.pool)
    .await?;
    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Center not found".to_owned()));
    }
    Ok((StatusCode::OK, Json(serde_json::json!({ "message": "Center updated" }))))
}

// ═══════════════════════════════════════════════════════════
//  TAGS
// ═══════════════════════════════════════════════════════════

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct TagRow { id: Uuid, name: String, created_at: chrono::DateTime<chrono::Utc> }

async fn list_tags(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    let rows = sqlx::query_as::<_, TagRow>("SELECT id, name, created_at FROM tags ORDER BY name ASC").fetch_all(&state.pool).await?;
    Ok((StatusCode::OK, Json(serde_json::json!({ "data": rows }))))
}

#[derive(Debug, Deserialize)]
struct CreateTagBody { name: String }

async fn create_tag(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser, Json(body): Json<CreateTagBody>) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    let name = body.name.trim();
    if name.is_empty() { return Err(AppError::BadRequest("Tag name required".to_owned())); }
    let id: Uuid = sqlx::query_scalar("INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id")
        .bind(name).fetch_optional(&state.pool).await?.ok_or_else(|| AppError::Conflict("Tag already exists".to_owned()))?;
    Ok((StatusCode::CREATED, Json(serde_json::json!({ "data": { "id": id } }))))
}

async fn delete_tag(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser, Path(tag_id): Path<Uuid>) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    sqlx::query("DELETE FROM tli_ce_ta WHERE fk_tag = $1").bind(tag_id).execute(&state.pool).await?;
    sqlx::query("DELETE FROM tags WHERE id = $1").bind(tag_id).execute(&state.pool).await?;
    Ok(StatusCode::NO_CONTENT)
}

// ═══════════════════════════════════════════════════════════
//  LOCATIONS
// ═══════════════════════════════════════════════════════════

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct LocationRow { id: Uuid, name: String, description: Option<String>, latitude: Option<Decimal>, longitude: Option<Decimal>, depth_max: Option<i32>, difficulty: Option<String>, country: Option<String>, region: Option<String>, created_at: chrono::DateTime<chrono::Utc> }

async fn list_locations(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    let rows = sqlx::query_as::<_, LocationRow>("SELECT id, name, description, latitude, longitude, depth_max, difficulty, country, region, created_at FROM locations WHERE deleted_at IS NULL ORDER BY name ASC LIMIT 500").fetch_all(&state.pool).await?;
    Ok((StatusCode::OK, Json(serde_json::json!({ "data": rows }))))
}

#[derive(Debug, Deserialize)]
struct CreateLocationBody { name: String, description: Option<String>, latitude: Option<Decimal>, longitude: Option<Decimal>, depth_max: Option<i32>, difficulty: Option<String>, country: Option<String>, region: Option<String> }

async fn create_location(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser, Json(body): Json<CreateLocationBody>) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    let id: Uuid = sqlx::query_scalar("INSERT INTO locations (name, description, latitude, longitude, depth_max, difficulty, country, region) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id")
        .bind(body.name.trim()).bind(body.description.as_deref()).bind(body.latitude).bind(body.longitude).bind(body.depth_max).bind(body.difficulty.as_deref()).bind(body.country.as_deref()).bind(body.region.as_deref())
        .fetch_one(&state.pool).await?;
    Ok((StatusCode::CREATED, Json(serde_json::json!({ "data": { "id": id } }))))
}

async fn update_location(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser, Path(location_id): Path<Uuid>, Json(body): Json<CreateLocationBody>) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    sqlx::query("UPDATE locations SET name=COALESCE($1,name), description=COALESCE($2,description), latitude=COALESCE($3,latitude), longitude=COALESCE($4,longitude), depth_max=COALESCE($5,depth_max), difficulty=COALESCE($6,difficulty), country=COALESCE($7,country), region=COALESCE($8,region), updated_at=NOW() WHERE id=$9 AND deleted_at IS NULL")
        .bind(body.name.trim()).bind(body.description.as_deref()).bind(body.latitude).bind(body.longitude).bind(body.depth_max).bind(body.difficulty.as_deref()).bind(body.country.as_deref()).bind(body.region.as_deref()).bind(location_id)
        .execute(&state.pool).await?;
    Ok((StatusCode::OK, Json(serde_json::json!({ "message": "Location updated" }))))
}

async fn delete_location(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser, Path(location_id): Path<Uuid>) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    sqlx::query("UPDATE locations SET deleted_at=NOW(), updated_at=NOW() WHERE id=$1 AND deleted_at IS NULL").bind(location_id).execute(&state.pool).await?;
    Ok(StatusCode::NO_CONTENT)
}

// ═══════════════════════════════════════════════════════════
//  SERVICE EXTRAS
// ═══════════════════════════════════════════════════════════

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct ExtraRow { id: Uuid, name: String, description: Option<String>, price: Decimal, currency: String, is_active: bool, created_at: chrono::DateTime<chrono::Utc> }

async fn list_extras(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    let rows = sqlx::query_as::<_, ExtraRow>("SELECT id, name, description, price, currency, is_active, created_at FROM service_extras WHERE deleted_at IS NULL ORDER BY name ASC").fetch_all(&state.pool).await?;
    Ok((StatusCode::OK, Json(serde_json::json!({ "data": rows }))))
}

#[derive(Debug, Deserialize)]
struct CreateExtraBody { name: String, description: Option<String>, price: Decimal, currency: Option<String> }

async fn create_extra(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser, Json(body): Json<CreateExtraBody>) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    let id: Uuid = sqlx::query_scalar("INSERT INTO service_extras (name, description, price, currency) VALUES ($1,$2,$3,$4) RETURNING id")
        .bind(body.name.trim()).bind(body.description.as_deref()).bind(body.price).bind(body.currency.as_deref().unwrap_or("EUR"))
        .fetch_one(&state.pool).await?;
    Ok((StatusCode::CREATED, Json(serde_json::json!({ "data": { "id": id } }))))
}

async fn update_extra(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser, Path(extra_id): Path<Uuid>, Json(body): Json<CreateExtraBody>) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    sqlx::query("UPDATE service_extras SET name=COALESCE($1,name), description=COALESCE($2,description), price=COALESCE($3,price), currency=COALESCE($4,currency), updated_at=NOW() WHERE id=$5 AND deleted_at IS NULL")
        .bind(body.name.trim()).bind(body.description.as_deref()).bind(body.price).bind(body.currency.as_deref()).bind(extra_id)
        .execute(&state.pool).await?;
    Ok((StatusCode::OK, Json(serde_json::json!({ "message": "Extra updated" }))))
}

async fn delete_extra(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser, Path(extra_id): Path<Uuid>) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    sqlx::query("UPDATE service_extras SET deleted_at=NOW(), updated_at=NOW() WHERE id=$1 AND deleted_at IS NULL").bind(extra_id).execute(&state.pool).await?;
    Ok(StatusCode::NO_CONTENT)
}

// ═══════════════════════════════════════════════════════════
//  COUPONS
// ═══════════════════════════════════════════════════════════

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct CouponRow { id: Uuid, code: String, discount_type: String, discount_value: Decimal, currency: String, max_uses: i32, used_count: i32, is_active: bool, expires_at: Option<chrono::DateTime<chrono::Utc>>, created_at: chrono::DateTime<chrono::Utc> }

async fn list_coupons(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    let rows = sqlx::query_as::<_, CouponRow>("SELECT id, code, discount_type, discount_value, currency, max_uses, used_count, is_active, expires_at, created_at FROM coupons ORDER BY created_at DESC LIMIT 500").fetch_all(&state.pool).await?;
    Ok((StatusCode::OK, Json(serde_json::json!({ "data": rows }))))
}

#[derive(Debug, Deserialize)]
struct CreateCouponBody { code: String, discount_type: String, discount_value: Decimal, currency: Option<String>, max_uses: Option<i32>, expires_at: Option<String> }

async fn create_coupon(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser, Json(body): Json<CreateCouponBody>) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    let exp = body.expires_at.as_deref().and_then(|d| chrono::DateTime::parse_from_rfc3339(d).ok()).map(|dt| dt.with_timezone(&chrono::Utc));
    let id: Uuid = sqlx::query_scalar("INSERT INTO coupons (code, discount_type, discount_value, currency, max_uses, expires_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id")
        .bind(body.code.trim().to_uppercase()).bind(&body.discount_type).bind(body.discount_value).bind(body.currency.as_deref().unwrap_or("EUR")).bind(body.max_uses.unwrap_or(1)).bind(exp)
        .fetch_one(&state.pool).await?;
    Ok((StatusCode::CREATED, Json(serde_json::json!({ "data": { "id": id } }))))
}

async fn update_coupon(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser, Path(coupon_id): Path<Uuid>, Json(body): Json<CreateCouponBody>) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    let exp = body.expires_at.as_deref().and_then(|d| chrono::DateTime::parse_from_rfc3339(d).ok()).map(|dt| dt.with_timezone(&chrono::Utc));
    sqlx::query("UPDATE coupons SET code=COALESCE($1,code), discount_type=COALESCE($2,discount_type), discount_value=COALESCE($3,discount_value), currency=COALESCE($4,currency), max_uses=COALESCE($5,max_uses), expires_at=COALESCE($6,expires_at), updated_at=NOW() WHERE id=$7")
        .bind(body.code.trim().to_uppercase()).bind(&body.discount_type).bind(body.discount_value).bind(body.currency.as_deref()).bind(body.max_uses).bind(exp).bind(coupon_id)
        .execute(&state.pool).await?;
    Ok((StatusCode::OK, Json(serde_json::json!({ "message": "Coupon updated" }))))
}

async fn delete_coupon(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser, Path(coupon_id): Path<Uuid>) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    sqlx::query("DELETE FROM coupons WHERE id = $1").bind(coupon_id).execute(&state.pool).await?;
    Ok(StatusCode::NO_CONTENT)
}

// Coupon sources
#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct CouponSourceRow { id: Uuid, slug: String, label: String, discount_type: String, discount_value: Decimal, is_active: bool, claims_count: i32, max_claims: Option<i32>, created_at: chrono::DateTime<chrono::Utc> }

async fn list_coupon_sources(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    let rows = sqlx::query_as::<_, CouponSourceRow>("SELECT id, slug, label, discount_type, discount_value, is_active, claims_count, max_claims, created_at FROM coupon_sources ORDER BY created_at DESC LIMIT 200").fetch_all(&state.pool).await?;
    Ok((StatusCode::OK, Json(serde_json::json!({ "data": rows }))))
}

#[derive(Debug, Deserialize)]
struct UpdateCouponSourceBody { label: Option<String>, is_active: Option<bool>, max_claims: Option<i32> }

async fn update_coupon_source(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser, Path(source_id): Path<Uuid>, Json(body): Json<UpdateCouponSourceBody>) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    sqlx::query("UPDATE coupon_sources SET label=COALESCE($1,label), is_active=COALESCE($2,is_active), max_claims=COALESCE($3,max_claims), updated_at=NOW() WHERE id=$4")
        .bind(body.label.as_deref()).bind(body.is_active).bind(body.max_claims).bind(source_id)
        .execute(&state.pool).await?;
    Ok((StatusCode::OK, Json(serde_json::json!({ "message": "Coupon source updated" }))))
}

// ═══════════════════════════════════════════════════════════
//  NOTIFICATIONS
// ═══════════════════════════════════════════════════════════

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct NotifRow { id: Uuid, title: String, body: String, link: Option<String>, is_read: bool, created_at: chrono::DateTime<chrono::Utc> }

async fn list_notifications(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    let rows = sqlx::query_as::<_, NotifRow>("SELECT id, title, body, link, is_read, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100").bind(claims.sub).fetch_all(&state.pool).await?;
    Ok((StatusCode::OK, Json(serde_json::json!({ "data": rows }))))
}

async fn mark_all_notifications_read(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    sqlx::query("UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false").bind(claims.sub).execute(&state.pool).await?;
    Ok((StatusCode::OK, Json(serde_json::json!({ "message": "All notifications marked as read" }))))
}

async fn mark_notification_read(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser, Path(notif_id): Path<Uuid>) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    sqlx::query("UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2").bind(notif_id).bind(claims.sub).execute(&state.pool).await?;
    Ok((StatusCode::OK, Json(serde_json::json!({ "message": "Notification marked as read" }))))
}

// ═══════════════════════════════════════════════════════════
//  VENDORS (centers from admin perspective)
// ═══════════════════════════════════════════════════════════

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct VendorRow { id: Uuid, name: String, slug: String, email: String, country: String, city: Option<String>, status: String, commission_rate: Option<Decimal>, total_revenue: Option<Decimal>, created_at: chrono::DateTime<chrono::Utc> }

async fn list_vendors(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    let rows = sqlx::query_as::<_, VendorRow>(
        r#"SELECT c.id, c.name, c.slug, c.email, c.country, c.city, c.status::text AS status,
                  NULL::numeric AS commission_rate,
                  (SELECT COALESCE(SUM(b.total_price), 0) FROM bookings b WHERE b.center_id = c.id AND b.status IN ('confirmed','completed') AND b.deleted_at IS NULL) AS total_revenue,
                  c.created_at
           FROM centers c WHERE c.deleted_at IS NULL ORDER BY c.created_at DESC LIMIT 500"#,
    ).fetch_all(&state.pool).await?;
    Ok((StatusCode::OK, Json(serde_json::json!({ "data": rows }))))
}

#[derive(Debug, Deserialize)]
struct UpdateVendorCommissionBody { commission_rate: Decimal }

async fn update_vendor_commission(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser, Path(_vendor_id): Path<Uuid>, Json(body): Json<UpdateVendorCommissionBody>) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    // Store vendor-specific rate in platform config (per-vendor rates not yet in schema)
    sqlx::query("INSERT INTO t_platform_config (key, value, category, is_secret) VALUES ('commission_rate', $1, 'finance', false) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW(), updated_by = $2")
        .bind(body.commission_rate.to_string()).bind(claims.sub)
        .execute(&state.pool).await?;
    Ok((StatusCode::OK, Json(serde_json::json!({ "message": "Commission rate updated" }))))
}

async fn suspend_vendor(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser, Path(vendor_id): Path<Uuid>) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    sqlx::query("UPDATE centers SET status = 'suspended'::center_status, updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL").bind(vendor_id).execute(&state.pool).await?;
    Ok((StatusCode::OK, Json(serde_json::json!({ "message": "Vendor suspended" }))))
}

async fn activate_vendor(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser, Path(vendor_id): Path<Uuid>) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    sqlx::query("UPDATE centers SET status = 'active'::center_status, updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL").bind(vendor_id).execute(&state.pool).await?;
    Ok((StatusCode::OK, Json(serde_json::json!({ "message": "Vendor activated" }))))
}

// ═══════════════════════════════════════════════════════════
//  COMMISSIONS (computed from bookings)
// ═══════════════════════════════════════════════════════════

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct CommissionRow { id: Uuid, center_name: Option<String>, total_price: Decimal, commission_amount: Decimal, currency: String, status: String, booking_date: chrono::NaiveDate, created_at: chrono::DateTime<chrono::Utc> }

async fn list_commissions(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    let rows = sqlx::query_as::<_, CommissionRow>(
        r#"SELECT b.id, c.name AS center_name, b.total_price, b.commission_amount, b.currency,
                  b.status::text AS status, b.booking_date, b.created_at
           FROM bookings b
           LEFT JOIN centers c ON c.id = b.center_id
           WHERE b.status IN ('confirmed','completed') AND b.deleted_at IS NULL
           ORDER BY b.created_at DESC LIMIT 500"#,
    ).fetch_all(&state.pool).await?;
    Ok((StatusCode::OK, Json(serde_json::json!({ "data": rows }))))
}

async fn get_commission_config(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    Ok((StatusCode::OK, Json(serde_json::json!({ "data": { "rate": 20, "currency": "EUR" } }))))
}

#[derive(Debug, Deserialize)]
struct UpdateCommissionConfigBody { rate: Decimal }

async fn update_commission_config(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser, Json(body): Json<UpdateCommissionConfigBody>) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    // Store in platform config
    sqlx::query("INSERT INTO t_platform_config (key, value, category, is_secret) VALUES ('commission_rate', $1, 'finance', false) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW(), updated_by = $2")
        .bind(body.rate.to_string()).bind(claims.sub)
        .execute(&state.pool).await?;
    Ok((StatusCode::OK, Json(serde_json::json!({ "message": "Commission config updated" }))))
}

async fn mark_commission_paid(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser, Path(commission_id): Path<Uuid>) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    sqlx::query("UPDATE bookings SET status = 'completed'::booking_status, updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL")
        .bind(commission_id).execute(&state.pool).await?;
    Ok((StatusCode::OK, Json(serde_json::json!({ "message": "Commission marked as paid" }))))
}

#[derive(Debug, Deserialize)]
struct BulkPayBody { commission_ids: Vec<Uuid> }

async fn bulk_pay_commissions(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser, Json(body): Json<BulkPayBody>) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    for id in &body.commission_ids {
        sqlx::query("UPDATE bookings SET status = 'completed'::booking_status, updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL")
            .bind(id).execute(&state.pool).await?;
    }
    Ok((StatusCode::OK, Json(serde_json::json!({ "message": format!("{} commissions marked as paid", body.commission_ids.len()) }))))
}

// ═══════════════════════════════════════════════════════════
//  PAYMENTS (computed from bookings)
// ═══════════════════════════════════════════════════════════

#[derive(Debug, Deserialize)]
struct PaymentsQuery { status: Option<String>, date_from: Option<String>, date_to: Option<String> }

async fn list_payments(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser, Query(params): Query<PaymentsQuery>) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;

    let today = chrono::Utc::now().date_naive();
    let from = params.date_from.as_deref().and_then(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());
    let to = params.date_to.as_deref().and_then(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok());
    let from_date = from.unwrap_or(today - chrono::Duration::days(365));
    let to_date = to.unwrap_or(today);

    let rows = if let Some(ref status_filter) = params.status {
        sqlx::query_as::<_, CommissionRow>(
            r#"SELECT b.id, c.name AS center_name, b.total_price, b.commission_amount, b.currency,
                      b.status::text AS status, b.booking_date, b.created_at
               FROM bookings b LEFT JOIN centers c ON c.id = b.center_id
               WHERE b.status::text = $1 AND b.booking_date BETWEEN $2 AND $3 AND b.deleted_at IS NULL
               ORDER BY b.created_at DESC LIMIT 500"#,
        ).bind(status_filter).bind(from_date).bind(to_date).fetch_all(&state.pool).await?
    } else {
        sqlx::query_as::<_, CommissionRow>(
            r#"SELECT b.id, c.name AS center_name, b.total_price, b.commission_amount, b.currency,
                      b.status::text AS status, b.booking_date, b.created_at
               FROM bookings b LEFT JOIN centers c ON c.id = b.center_id
               WHERE b.booking_date BETWEEN $1 AND $2 AND b.deleted_at IS NULL
               ORDER BY b.created_at DESC LIMIT 500"#,
        ).bind(from_date).bind(to_date).fetch_all(&state.pool).await?
    };

    Ok((StatusCode::OK, Json(serde_json::json!({ "data": rows }))))
}

// ═══════════════════════════════════════════════════════════
//  REFUNDS
// ═══════════════════════════════════════════════════════════

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct RefundRow { id: Uuid, booking_id: Uuid, amount: Decimal, currency: String, reason: Option<String>, status: String, created_at: chrono::DateTime<chrono::Utc> }

async fn list_refunds(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    let rows = sqlx::query_as::<_, RefundRow>("SELECT id, booking_id, amount, currency, reason, status, created_at FROM refunds ORDER BY created_at DESC LIMIT 500").fetch_all(&state.pool).await?;
    Ok((StatusCode::OK, Json(serde_json::json!({ "data": rows }))))
}

async fn approve_refund(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser, Path(refund_id): Path<Uuid>) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    sqlx::query("UPDATE refunds SET status = 'approved', processed_by = $1, updated_at = NOW() WHERE id = $2 AND status = 'pending'")
        .bind(claims.sub).bind(refund_id).execute(&state.pool).await?;
    Ok((StatusCode::OK, Json(serde_json::json!({ "message": "Refund approved" }))))
}

async fn reject_refund(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser, Path(refund_id): Path<Uuid>) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    sqlx::query("UPDATE refunds SET status = 'rejected', processed_by = $1, updated_at = NOW() WHERE id = $2 AND status = 'pending'")
        .bind(claims.sub).bind(refund_id).execute(&state.pool).await?;
    Ok((StatusCode::OK, Json(serde_json::json!({ "message": "Refund rejected" }))))
}

// ═══════════════════════════════════════════════════════════
//  REPORTS (computed from bookings)
// ═══════════════════════════════════════════════════════════

#[derive(Debug, Deserialize)]
struct ReportQuery { date_from: Option<String>, date_to: Option<String> }

async fn get_reports(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser, Query(params): Query<ReportQuery>) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;

    let today = chrono::Utc::now().date_naive();
    let from_date = params.date_from.as_deref().and_then(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok()).unwrap_or(today - chrono::Duration::days(365));
    let to_date = params.date_to.as_deref().and_then(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok()).unwrap_or(today);

    let stats = sqlx::query_as::<_, (i64, Option<Decimal>, Option<Decimal>, i64, Option<f64>)>(
        r#"SELECT
            (SELECT COUNT(*) FROM bookings WHERE booking_date BETWEEN $1 AND $2 AND deleted_at IS NULL),
            (SELECT COALESCE(SUM(total_price),0) FROM bookings WHERE status IN ('confirmed','completed') AND booking_date BETWEEN $1 AND $2 AND deleted_at IS NULL),
            (SELECT COALESCE(SUM(commission_amount),0) FROM bookings WHERE status IN ('confirmed','completed') AND booking_date BETWEEN $1 AND $2 AND deleted_at IS NULL),
            (SELECT COUNT(*) FROM reviews WHERE deleted_at IS NULL),
            (SELECT AVG(rating::float) FROM reviews WHERE is_published = true AND deleted_at IS NULL)
        "#,
    ).bind(from_date).bind(to_date).fetch_one(&state.pool).await?;
    Ok((StatusCode::OK, Json(serde_json::json!({
        "data": { "total_bookings": stats.0, "total_revenue": stats.1, "total_commissions": stats.2, "total_reviews": stats.3, "average_rating": stats.4, "date_from": from_date, "date_to": to_date }
    }))))
}

// ═══════════════════════════════════════════════════════════
//  PLANNINGS (calendar from bookings)
// ═══════════════════════════════════════════════════════════

#[derive(Debug, Deserialize)]
struct PlanningsQuery { center_id: Option<Uuid>, date_from: Option<String>, date_to: Option<String> }

async fn get_plannings(State(state): State<Arc<AppState>>, AuthUser(claims): AuthUser, Query(params): Query<PlanningsQuery>) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    let today = chrono::Utc::now().date_naive();
    let from = params.date_from.as_deref().and_then(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok()).unwrap_or(today);
    let to = params.date_to.as_deref().and_then(|d| chrono::NaiveDate::parse_from_str(d, "%Y-%m-%d").ok()).unwrap_or(today + chrono::Duration::days(30));

    let rows = if let Some(cid) = params.center_id {
        sqlx::query_as::<_, (Uuid, chrono::NaiveDate, chrono::NaiveTime, i32, String, Option<String>, Option<String>)>(
            r#"SELECT b.id, b.booking_date, b.time_slot, b.participants, b.status::text, c.name, s.name
               FROM bookings b LEFT JOIN centers c ON c.id=b.center_id LEFT JOIN services s ON s.id=b.service_id
               WHERE b.center_id=$1 AND b.booking_date BETWEEN $2 AND $3 AND b.status NOT IN ('cancelled') AND b.deleted_at IS NULL
               ORDER BY b.booking_date, b.time_slot LIMIT 500"#,
        ).bind(cid).bind(from).bind(to).fetch_all(&state.pool).await?
    } else {
        sqlx::query_as::<_, (Uuid, chrono::NaiveDate, chrono::NaiveTime, i32, String, Option<String>, Option<String>)>(
            r#"SELECT b.id, b.booking_date, b.time_slot, b.participants, b.status::text, c.name, s.name
               FROM bookings b LEFT JOIN centers c ON c.id=b.center_id LEFT JOIN services s ON s.id=b.service_id
               WHERE b.booking_date BETWEEN $1 AND $2 AND b.status NOT IN ('cancelled') AND b.deleted_at IS NULL
               ORDER BY b.booking_date, b.time_slot LIMIT 500"#,
        ).bind(from).bind(to).fetch_all(&state.pool).await?
    };

    let data: Vec<serde_json::Value> = rows.into_iter().map(|r| serde_json::json!({
        "id": r.0, "booking_date": r.1, "time_slot": r.2, "participants": r.3,
        "status": r.4, "center_name": r.5, "service_name": r.6
    })).collect();

    Ok((StatusCode::OK, Json(serde_json::json!({ "data": data }))))
}

// ═══════════════════════════════════════════════════════════
//  SETTINGS BY CATEGORY
// ═══════════════════════════════════════════════════════════

async fn get_settings_by_cat(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    axum::extract::OriginalUri(uri): axum::extract::OriginalUri,
) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    let category = uri.path().rsplit('/').next().unwrap_or("general");
    let rows = sqlx::query_as::<_, (String, String, bool, Option<String>)>(
        "SELECT key, value, is_secret, description FROM t_platform_config WHERE category = $1 ORDER BY key ASC",
    )
    .bind(category)
    .fetch_all(&state.pool)
    .await?;

    let data: Vec<serde_json::Value> = rows.into_iter().map(|r| {
        let val = if r.2 { format!("****{}", &r.1[r.1.len().saturating_sub(4)..]) } else { r.1 };
        serde_json::json!({ "key": r.0, "value": val, "is_secret": r.2, "description": r.3 })
    }).collect();

    Ok((StatusCode::OK, Json(serde_json::json!({ "data": data }))))
}

#[derive(Debug, Deserialize)]
struct SettingsBulkBody {
    settings: Vec<SettingEntry>,
}

#[derive(Debug, Deserialize)]
struct SettingEntry {
    key: String,
    value: String,
}

async fn update_settings_by_cat(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    axum::extract::OriginalUri(uri): axum::extract::OriginalUri,
    Json(body): Json<SettingsBulkBody>,
) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;
    let category = uri.path().rsplit('/').next().unwrap_or("general");

    for entry in &body.settings {
        sqlx::query(
            "INSERT INTO t_platform_config (key, value, category, is_secret) VALUES ($1, $2, $3, false) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW(), updated_by = $4",
        )
        .bind(&entry.key)
        .bind(&entry.value)
        .bind(category)
        .bind(claims.sub)
        .execute(&state.pool)
        .await?;
    }

    Ok((StatusCode::OK, Json(serde_json::json!({ "message": format!("{} settings updated", body.settings.len()) }))))
}
