//! Coupon routes: validate, claim, list user coupons, list public sources.
//!
//! These routes provide:
//! - Public listing of active coupon sources
//! - Authenticated coupon validation before booking
//! - Authenticated coupon claiming from a source
//! - Listing the authenticated user's coupons

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
use crate::middleware::auth::AuthUser;
use crate::AppState;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/coupons/sources", get(list_active_sources))
        .route("/coupons/mine", get(list_my_coupons))
        .route("/coupons/validate", get(validate_coupon))
        .route("/coupons/claim/{source_slug}", post(claim_coupon))
}

// ──────────────────────── Types ────────────────────────

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct CouponSourceRow {
    id: Uuid,
    slug: String,
    label: String,
    discount_type: String,
    discount_value: Decimal,
    currency: String,
    max_claims: Option<i32>,
    claims_count: i32,
    is_active: bool,
    expires_at: Option<chrono::DateTime<chrono::Utc>>,
    created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct CouponRow {
    id: Uuid,
    code: String,
    source_id: Option<Uuid>,
    center_id: Option<Uuid>,
    discount_type: String,
    discount_value: Decimal,
    currency: String,
    min_amount: Option<Decimal>,
    max_uses: i32,
    used_count: i32,
    is_active: bool,
    expires_at: Option<chrono::DateTime<chrono::Utc>>,
    created_at: chrono::DateTime<chrono::Utc>,
}

// ──────────────────────── List active sources (public) ────────────────────────

/// `GET /api/v1/coupons/sources` — public, list active coupon sources.
async fn list_active_sources(
    State(state): State<Arc<AppState>>,
) -> Result<impl IntoResponse, AppError> {
    let sources = sqlx::query_as::<_, CouponSourceRow>(
        r#"
        SELECT id, slug, label, discount_type, discount_value, currency,
               max_claims, claims_count, is_active, expires_at, created_at
        FROM coupon_sources
        WHERE is_active = true
          AND (expires_at IS NULL OR expires_at > NOW())
          AND (max_claims IS NULL OR claims_count < max_claims)
        ORDER BY created_at DESC
        LIMIT 50
        "#,
    )
    .fetch_all(&state.pool)
    .await?;

    Ok((StatusCode::OK, Json(serde_json::json!({ "data": sources }))))
}

// ──────────────────────── List my coupons (auth) ────────────────────────

/// `GET /api/v1/coupons/mine` — auth, list the authenticated user's coupons.
async fn list_my_coupons(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
) -> Result<impl IntoResponse, AppError> {
    let coupons = sqlx::query_as::<_, CouponRow>(
        r#"
        SELECT id, code, source_id, center_id, discount_type, discount_value,
               currency, min_amount, max_uses, used_count, is_active, expires_at, created_at
        FROM coupons
        WHERE user_id = $1
          AND is_active = true
          AND used_count < max_uses
          AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY created_at DESC
        LIMIT 100
        "#,
    )
    .bind(claims.sub)
    .fetch_all(&state.pool)
    .await?;

    Ok((StatusCode::OK, Json(serde_json::json!({ "data": coupons }))))
}

// ──────────────────────── Validate coupon (auth) ────────────────────────

#[derive(Debug, Deserialize)]
struct ValidateQuery {
    code: String,
    center_id: Option<Uuid>,
    /// Reserved for future service-level coupon validation.
    #[allow(dead_code)]
    service_id: Option<Uuid>,
}

#[derive(Debug, serde::Serialize)]
struct ValidationResult {
    valid: bool,
    coupon_id: Option<Uuid>,
    discount_type: Option<String>,
    discount_value: Option<Decimal>,
    message: String,
}

/// `GET /api/v1/coupons/validate?code=&center_id=&service_id=` — auth, validate a coupon.
async fn validate_coupon(
    State(state): State<Arc<AppState>>,
    AuthUser(_claims): AuthUser,
    Query(params): Query<ValidateQuery>,
) -> Result<impl IntoResponse, AppError> {
    let code = params.code.trim();
    if code.is_empty() {
        return Err(AppError::BadRequest("Coupon code is required".to_owned()));
    }

    let coupon = sqlx::query_as::<_, CouponRow>(
        r#"
        SELECT id, code, source_id, center_id, discount_type, discount_value,
               currency, min_amount, max_uses, used_count, is_active, expires_at, created_at
        FROM coupons
        WHERE code = $1
        "#,
    )
    .bind(code)
    .fetch_optional(&state.pool)
    .await?;

    let result = match coupon {
        None => ValidationResult {
            valid: false,
            coupon_id: None,
            discount_type: None,
            discount_value: None,
            message: "Coupon not found".to_owned(),
        },
        Some(c) => {
            if !c.is_active {
                ValidationResult {
                    valid: false,
                    coupon_id: Some(c.id),
                    discount_type: None,
                    discount_value: None,
                    message: "Coupon is no longer active".to_owned(),
                }
            } else if c.used_count >= c.max_uses {
                ValidationResult {
                    valid: false,
                    coupon_id: Some(c.id),
                    discount_type: None,
                    discount_value: None,
                    message: "Coupon has reached its usage limit".to_owned(),
                }
            } else if c
                .expires_at
                .is_some_and(|exp| exp < chrono::Utc::now())
            {
                ValidationResult {
                    valid: false,
                    coupon_id: Some(c.id),
                    discount_type: None,
                    discount_value: None,
                    message: "Coupon has expired".to_owned(),
                }
            } else if let Some(center_id) = params.center_id {
                // If coupon is tied to a specific center, check match
                if c.center_id.is_some_and(|cid| cid != center_id) {
                    ValidationResult {
                        valid: false,
                        coupon_id: Some(c.id),
                        discount_type: None,
                        discount_value: None,
                        message: "Coupon is not valid for this center".to_owned(),
                    }
                } else {
                    ValidationResult {
                        valid: true,
                        coupon_id: Some(c.id),
                        discount_type: Some(c.discount_type),
                        discount_value: Some(c.discount_value),
                        message: "Coupon is valid".to_owned(),
                    }
                }
            } else {
                ValidationResult {
                    valid: true,
                    coupon_id: Some(c.id),
                    discount_type: Some(c.discount_type),
                    discount_value: Some(c.discount_value),
                    message: "Coupon is valid".to_owned(),
                }
            }
        }
    };

    Ok((StatusCode::OK, Json(serde_json::json!({ "data": result }))))
}

// ──────────────────────── Claim coupon (auth) ────────────────────────

/// `POST /api/v1/coupons/claim/{source_slug}` — auth, claim a coupon from a source.
async fn claim_coupon(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(source_slug): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    // Fetch the source
    let source = sqlx::query_as::<_, CouponSourceRow>(
        r#"
        SELECT id, slug, label, discount_type, discount_value, currency,
               max_claims, claims_count, is_active, expires_at, created_at
        FROM coupon_sources
        WHERE slug = $1
        "#,
    )
    .bind(&source_slug)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::NotFound(format!("Coupon source '{source_slug}' not found")))?;

    if !source.is_active {
        return Err(AppError::BadRequest(
            "This coupon source is no longer active".to_owned(),
        ));
    }
    if source
        .expires_at
        .is_some_and(|exp| exp < chrono::Utc::now())
    {
        return Err(AppError::BadRequest(
            "This coupon source has expired".to_owned(),
        ));
    }
    if source
        .max_claims
        .is_some_and(|max| source.claims_count >= max)
    {
        return Err(AppError::BadRequest(
            "This coupon source has no remaining claims".to_owned(),
        ));
    }

    // Check if user already claimed from this source
    let already_claimed: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM coupons WHERE source_id = $1 AND user_id = $2)",
    )
    .bind(source.id)
    .bind(claims.sub)
    .fetch_one(&state.pool)
    .await?;

    if already_claimed {
        return Err(AppError::Conflict(
            "You have already claimed a coupon from this source".to_owned(),
        ));
    }

    // Generate a unique coupon code
    let code = generate_coupon_code(&source.slug);

    // Create the coupon for this user
    let coupon_id: Uuid = sqlx::query_scalar(
        r#"
        INSERT INTO coupons (code, source_id, user_id, discount_type, discount_value, currency)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
        "#,
    )
    .bind(&code)
    .bind(source.id)
    .bind(claims.sub)
    .bind(&source.discount_type)
    .bind(source.discount_value)
    .bind(&source.currency)
    .fetch_one(&state.pool)
    .await?;

    // Increment claims_count on the source
    sqlx::query("UPDATE coupon_sources SET claims_count = claims_count + 1, updated_at = NOW() WHERE id = $1")
        .bind(source.id)
        .execute(&state.pool)
        .await?;

    Ok((
        StatusCode::CREATED,
        Json(serde_json::json!({
            "data": {
                "source": { "slug": source.slug },
                "coupon": { "id": coupon_id, "code": code }
            }
        })),
    ))
}

/// Generate a unique-looking coupon code from the source slug + UUID-derived suffix.
fn generate_coupon_code(slug: &str) -> String {
    let prefix = slug
        .chars()
        .filter(|c| c.is_alphanumeric())
        .take(6)
        .collect::<String>()
        .to_uppercase();
    // Use the first 6 hex chars of a v4 UUID as a random suffix
    let uuid_hex = Uuid::new_v4().simple().to_string();
    let suffix = &uuid_hex[..6];
    format!("{prefix}-{}", suffix.to_uppercase())
}
