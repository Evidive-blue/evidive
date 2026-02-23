//! Admin settings routes: read/update platform configuration from `t_platform_config`.
//!
//! Secret values are masked in GET responses (only the last 4 characters are shown).
//! PUT replaces the full value.

use std::sync::Arc;

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::get;
use axum::{Json, Router};
use serde::{Deserialize, Serialize};

use crate::error::AppError;
use crate::middleware::auth::{require_admin, AuthUser};
use crate::models::PlatformConfig;
use crate::AppState;

/// A config entry with the value masked if it is a secret.
#[derive(Debug, Serialize)]
struct MaskedConfig {
    key: String,
    value: String,
    category: String,
    is_secret: bool,
    description: Option<String>,
    updated_at: chrono::DateTime<chrono::Utc>,
    updated_by: Option<uuid::Uuid>,
}

impl MaskedConfig {
    fn from_row(row: PlatformConfig) -> Self {
        let masked_value = if row.is_secret {
            mask_secret(&row.value)
        } else {
            row.value
        };
        Self {
            key: row.key,
            value: masked_value,
            category: row.category,
            is_secret: row.is_secret,
            description: row.description,
            updated_at: row.updated_at,
            updated_by: row.updated_by,
        }
    }
}

/// Mask a secret value: show only the last 4 characters with stars.
fn mask_secret(value: &str) -> String {
    if value.is_empty() {
        return String::new();
    }
    let visible = value.len().min(4);
    let stars = "****";
    format!("{}{}", stars, &value[value.len() - visible..])
}

/// `GET /api/v1/admin/settings` — list all platform configs (secrets masked).
async fn list_settings(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;

    let rows = sqlx::query_as::<_, PlatformConfig>(
        r#"
        SELECT key, value, category, is_secret, description, updated_at, updated_by
        FROM t_platform_config
        ORDER BY category ASC, key ASC
        "#,
    )
    .fetch_all(&state.pool)
    .await?;

    let masked: Vec<MaskedConfig> = rows.into_iter().map(MaskedConfig::from_row).collect();

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({ "data": masked })),
    ))
}

/// Body for updating a single config value.
#[derive(Debug, Deserialize)]
struct UpdateSettingBody {
    value: String,
}

/// `PUT /api/v1/admin/settings/{key}` — update a platform config value.
async fn update_setting(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(key): Path<String>,
    Json(body): Json<UpdateSettingBody>,
) -> Result<impl IntoResponse, AppError> {
    require_admin(&state.pool, claims.sub).await?;

    let result = sqlx::query(
        r#"
        UPDATE t_platform_config
        SET value = $1, updated_by = $2, updated_at = NOW()
        WHERE key = $3
        "#,
    )
    .bind(&body.value)
    .bind(claims.sub)
    .bind(&key)
    .execute(&state.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound(format!(
            "Configuration key '{key}' not found"
        )));
    }

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({ "message": "Setting updated" })),
    ))
}

/// Build the `/admin/settings` sub-router.
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_settings))
        .route("/{key}", axum::routing::put(update_setting))
}
