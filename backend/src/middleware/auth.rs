use std::sync::Arc;

use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use jsonwebtoken::{decode, jwk, Algorithm, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::AppError;
use crate::AppState;

/// JWT claims extracted from the `Authorization: Bearer <token>` header.
/// Follows Supabase JWT format (ES256 / ECC P-256).
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    /// Subject: the user's UUID
    pub sub: Uuid,
    /// Supabase role (e.g. "authenticated")
    pub role: String,
    /// Expiration timestamp
    pub exp: usize,
    /// Issued at
    pub iat: usize,
}

/// Extractor that validates the JWT from the Authorization header.
/// Use as a handler parameter: `AuthUser(claims): AuthUser`
pub struct AuthUser(pub Claims);

impl FromRequestParts<Arc<AppState>> for AuthUser {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &Arc<AppState>,
    ) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get("authorization")
            .and_then(|v| v.to_str().ok())
            .ok_or(AppError::Unauthorized)?;

        let token = auth_header
            .strip_prefix("Bearer ")
            .ok_or(AppError::Unauthorized)?;

        let mut validation = Validation::new(state.jwt_algorithm);
        validation.set_audience(&["authenticated"]);
        validation.set_issuer(&[&state.jwt_issuer]);

        let token_data =
            decode::<Claims>(token, &state.jwt_decoding_key, &validation).map_err(|e| {
                tracing::warn!(error = %e, "JWT validation failed");
                AppError::Unauthorized
            })?;

        Ok(AuthUser(token_data.claims))
    }
}

/// Check if the authenticated user is an admin_diver.
/// Used in handlers: `require_admin(&pool, user_id).await?`
pub async fn require_admin(pool: &sqlx::PgPool, user_id: Uuid) -> Result<(), AppError> {
    let role: Option<String> =
        sqlx::query_scalar("SELECT role::text FROM profiles WHERE id = $1 AND deleted_at IS NULL")
            .bind(user_id)
            .fetch_optional(pool)
            .await?;

    match role.as_deref() {
        Some("admin_diver") => Ok(()),
        _ => Err(AppError::Forbidden),
    }
}

/// Check if the authenticated user is a member (owner or staff) of a center.
pub async fn require_center_member(
    pool: &sqlx::PgPool,
    user_id: Uuid,
    center_id: Uuid,
) -> Result<(), AppError> {
    let is_member: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM tli_pr_ce WHERE fk_profile = $1 AND fk_center = $2)",
    )
    .bind(user_id)
    .bind(center_id)
    .fetch_one(pool)
    .await?;

    if is_member {
        Ok(())
    } else {
        Err(AppError::Forbidden)
    }
}

/// Fetch the role of a user within a center. Returns `None` if not a member.
pub async fn get_center_role(
    pool: &sqlx::PgPool,
    user_id: Uuid,
    center_id: Uuid,
) -> Result<Option<String>, AppError> {
    let role: Option<String> = sqlx::query_scalar(
        "SELECT role_in_center FROM tli_pr_ce WHERE fk_profile = $1 AND fk_center = $2",
    )
    .bind(user_id)
    .bind(center_id)
    .fetch_optional(pool)
    .await?;
    Ok(role)
}

/// Require that the authenticated user is the owner of a center.
pub async fn require_center_owner(
    pool: &sqlx::PgPool,
    user_id: Uuid,
    center_id: Uuid,
) -> Result<(), AppError> {
    let role = get_center_role(pool, user_id, center_id).await?;
    match role.as_deref() {
        Some("owner") => Ok(()),
        Some(_) => Err(AppError::Forbidden),
        None => Err(AppError::Forbidden),
    }
}

/// Fetch the JWKS from Supabase and build a `DecodingKey`.
/// Called once at startup. Panics if the key cannot be fetched (server cannot run without it).
pub async fn fetch_jwks(
    jwks_url: &str,
) -> Result<(DecodingKey, Algorithm, String), Box<dyn std::error::Error + Send + Sync>> {
    tracing::info!(url = %jwks_url, "Fetching JWKS for JWT verification");

    let response = reqwest::get(jwks_url).await?;
    let jwks: jwk::JwkSet = response.json().await?;

    let key = jwks
        .keys
        .first()
        .ok_or("JWKS response contains no keys")?;

    let algorithm = match key
        .common
        .key_algorithm
        .ok_or("JWK missing algorithm field")?
    {
        jwk::KeyAlgorithm::ES256 => Algorithm::ES256,
        jwk::KeyAlgorithm::ES384 => Algorithm::ES384,
        jwk::KeyAlgorithm::RS256 => Algorithm::RS256,
        jwk::KeyAlgorithm::RS384 => Algorithm::RS384,
        jwk::KeyAlgorithm::RS512 => Algorithm::RS512,
        other => return Err(format!("Unsupported JWT algorithm: {other:?}").into()),
    };

    let kid = key
        .common
        .key_id
        .clone()
        .unwrap_or_default();

    let decoding_key = DecodingKey::from_jwk(key)?;

    tracing::info!(
        algorithm = ?algorithm,
        kid = %kid,
        "JWKS loaded successfully"
    );

    Ok((decoding_key, algorithm, kid))
}
