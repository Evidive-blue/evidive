use std::sync::Arc;

use axum::extract::State;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::get;
use axum::{Json, Router};
use serde::Deserialize;

use crate::error::AppError;
use crate::middleware::auth::AuthUser;
use crate::models::{Profile, ProfileCenterSummary};
use crate::AppState;

/// Build the `/profile` sub-router. All routes require authentication.
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/me", get(get_my_profile).patch(update_my_profile))
        .route("/centers", get(get_my_centers))
}

/// `GET /api/v1/profile/me`
///
/// Returns the authenticated user's profile.
async fn get_my_profile(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
) -> Result<impl IntoResponse, AppError> {
    let profile = sqlx::query_as::<_, Profile>(
        r#"
        SELECT id, role::text AS role, first_name, last_name, display_name,
               avatar_url, phone, preferred_locale, created_at, updated_at
        FROM profiles
        WHERE id = $1 AND deleted_at IS NULL
        "#,
    )
    .bind(claims.sub)
    .fetch_optional(&state.pool)
    .await?;

    match profile {
        Some(p) => Ok((StatusCode::OK, Json(serde_json::json!({ "data": p })))),
        None => Err(AppError::NotFound("Profile not found".to_owned())),
    }
}

/// Body for updating the authenticated user's profile.
#[derive(Debug, Deserialize)]
struct UpdateProfileBody {
    first_name: Option<String>,
    last_name: Option<String>,
    display_name: Option<String>,
    phone: Option<String>,
    avatar_url: Option<String>,
    preferred_locale: Option<String>,
}

/// `PATCH /api/v1/profile/me`
///
/// Updates the authenticated user's profile. Only provided fields are updated.
async fn update_my_profile(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Json(body): Json<UpdateProfileBody>,
) -> Result<impl IntoResponse, AppError> {
    // Validate preferred_locale if provided
    if let Some(ref locale) = body.preferred_locale {
        let valid_locales = ["fr", "en", "de", "es", "it", "pt", "nl"];
        if !valid_locales.contains(&locale.as_str()) {
            return Err(AppError::BadRequest(format!(
                "Invalid locale '{locale}'. Must be one of: fr, en, de, es, it, pt, nl"
            )));
        }
    }

    let result = sqlx::query(
        r#"
        UPDATE profiles
        SET first_name       = COALESCE($1, first_name),
            last_name        = COALESCE($2, last_name),
            display_name     = COALESCE($3, display_name),
            phone            = COALESCE($4, phone),
            avatar_url       = COALESCE($5, avatar_url),
            preferred_locale = COALESCE($6, preferred_locale),
            updated_at       = NOW()
        WHERE id = $7 AND deleted_at IS NULL
        "#,
    )
    .bind(body.first_name.as_deref().map(str::trim))
    .bind(body.last_name.as_deref().map(str::trim))
    .bind(body.display_name.as_deref().map(str::trim))
    .bind(body.phone.as_deref().map(str::trim))
    .bind(body.avatar_url.as_deref())
    .bind(body.preferred_locale.as_deref())
    .bind(claims.sub)
    .execute(&state.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Profile not found".to_owned()));
    }

    // Return the updated profile
    let profile = sqlx::query_as::<_, Profile>(
        r#"
        SELECT id, role::text AS role, first_name, last_name, display_name,
               avatar_url, phone, preferred_locale, created_at, updated_at
        FROM profiles
        WHERE id = $1 AND deleted_at IS NULL
        "#,
    )
    .bind(claims.sub)
    .fetch_one(&state.pool)
    .await?;

    Ok((StatusCode::OK, Json(serde_json::json!({ "data": profile }))))
}

/// `GET /api/v1/profile/centers`
///
/// Returns all centers the authenticated user is a member of (via tli_pr_ce).
async fn get_my_centers(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
) -> Result<impl IntoResponse, AppError> {
    let centers = sqlx::query_as::<_, ProfileCenterSummary>(
        r#"
        SELECT c.id, c.name, c.slug, c.city, c.country, c.latitude, c.longitude,
               c.logo_url, c.cover_url, c.price_from, c.currency, c.is_featured,
               c.eco_commitment, c.status::text AS status
        FROM centers c
        INNER JOIN tli_pr_ce link ON link.fk_center = c.id
        WHERE link.fk_profile = $1
          AND c.deleted_at IS NULL
        ORDER BY c.name ASC
        LIMIT 50
        "#,
    )
    .bind(claims.sub)
    .fetch_all(&state.pool)
    .await?;

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({ "data": centers })),
    ))
}
