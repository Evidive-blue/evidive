//! Stripe Connect routes for center owners.
//!
//! These routes provide:
//! - Creating a Stripe Connect onboarding link for a center
//! - Reading and updating the Stripe payout configuration

use std::sync::Arc;

use axum::extract::State;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::Deserialize;
use uuid::Uuid;

use crate::error::AppError;
use crate::middleware::auth::AuthUser;
use crate::AppState;

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/stripe/connect", post(create_connect_link))
        .route(
            "/stripe/config",
            get(get_stripe_config).patch(update_stripe_config),
        )
}

// ──────────────────────── Types ────────────────────────

#[derive(Debug, serde::Serialize)]
struct ConnectLinkResponse {
    url: String,
    center_id: Uuid,
}

#[derive(Debug, Deserialize)]
struct ConnectBody {
    center_id: Uuid,
}

#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct StripeConfigRow {
    center_id: Uuid,
    center_name: String,
    stripe_account_id: Option<String>,
    stripe_onboarding_complete: Option<bool>,
    currency: String,
}

#[derive(Debug, Deserialize)]
struct UpdateStripeConfigBody {
    center_id: Uuid,
    currency: Option<String>,
}

// ──────────────────────── Create Connect link ────────────────────────

/// `POST /api/v1/stripe/connect` — auth, create a Stripe Connect onboarding link.
async fn create_connect_link(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Json(body): Json<ConnectBody>,
) -> Result<impl IntoResponse, AppError> {
    crate::middleware::auth::require_center_owner(&state.pool, claims.sub, body.center_id).await?;

    // Fetch existing Stripe info
    let center_stripe: Option<(Option<String>, Option<bool>)> = sqlx::query_as::<_, (Option<String>, Option<bool>)>(
        "SELECT stripe_account_id, stripe_onboarding_complete FROM centers WHERE id = $1 AND deleted_at IS NULL",
    )
    .bind(body.center_id)
    .fetch_optional(&state.pool)
    .await?;

    let (existing_account_id, _onboarding_complete) = center_stripe
        .ok_or_else(|| AppError::NotFound("Center not found".to_owned()))?;

    let stripe_account_id = match existing_account_id {
        Some(acct_id) if !acct_id.is_empty() => acct_id,
        _ => {
            // Create a new Stripe Connect Express account
            let params = stripe::CreateAccount::new();
            let account = stripe::Account::create(&state.stripe, params)
                .await
                .map_err(|e| AppError::Internal(format!("Stripe API error: {e}")))?;

            let acct_id = account.id.to_string();

            // Persist the new account ID
            sqlx::query(
                "UPDATE centers SET stripe_account_id = $1, updated_at = NOW() WHERE id = $2",
            )
            .bind(&acct_id)
            .bind(body.center_id)
            .execute(&state.pool)
            .await?;

            acct_id
        }
    };

    let base_url = state
        .config
        .cors_origin
        .split(',')
        .next()
        .unwrap_or_default()
        .trim();

    let account_id: stripe::AccountId = stripe_account_id
        .parse()
        .map_err(|_| AppError::Internal("Invalid stored Stripe account ID".to_owned()))?;

    let mut link_params =
        stripe::CreateAccountLink::new(account_id, stripe::AccountLinkType::AccountOnboarding);
    let refresh_url = format!("{base_url}/dashboard/stripe/refresh");
    let return_url = format!("{base_url}/dashboard/stripe/return");
    link_params.refresh_url = Some(&refresh_url);
    link_params.return_url = Some(&return_url);

    let link = stripe::AccountLink::create(&state.stripe, link_params)
        .await
        .map_err(|e| AppError::Internal(format!("Stripe API error: {e}")))?;

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({
            "data": ConnectLinkResponse {
                url: link.url,
                center_id: body.center_id,
            }
        })),
    ))
}

// ──────────────────────── Get config ────────────────────────

/// `GET /api/v1/stripe/config` — auth, get Stripe config for the user's centers.
async fn get_stripe_config(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
) -> Result<impl IntoResponse, AppError> {
    let configs = sqlx::query_as::<_, StripeConfigRow>(
        r#"
        SELECT c.id AS center_id, c.name AS center_name,
               c.stripe_account_id, c.stripe_onboarding_complete,
               COALESCE(c.currency, 'EUR') AS currency
        FROM centers c
        INNER JOIN tli_pr_ce m ON m.fk_center = c.id AND m.fk_profile = $1
        WHERE c.deleted_at IS NULL
          AND m.role_in_center = 'owner'
        ORDER BY c.name ASC
        LIMIT 10
        "#,
    )
    .bind(claims.sub)
    .fetch_all(&state.pool)
    .await?;

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({ "data": configs })),
    ))
}

// ──────────────────────── Update config ────────────────────────

/// `PATCH /api/v1/stripe/config` — auth, update Stripe payout config for a center.
async fn update_stripe_config(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Json(body): Json<UpdateStripeConfigBody>,
) -> Result<impl IntoResponse, AppError> {
    crate::middleware::auth::require_center_owner(&state.pool, claims.sub, body.center_id).await?;

    if let Some(ref currency) = body.currency {
        let valid_currencies = ["EUR", "USD", "GBP", "CHF"];
        if !valid_currencies.contains(&currency.as_str()) {
            return Err(AppError::BadRequest(format!(
                "Invalid currency: {currency}. Supported: {}",
                valid_currencies.join(", ")
            )));
        }

        sqlx::query("UPDATE centers SET currency = $1, updated_at = NOW() WHERE id = $2")
            .bind(currency)
            .bind(body.center_id)
            .execute(&state.pool)
            .await?;
    }

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({ "message": "Configuration updated" })),
    ))
}
