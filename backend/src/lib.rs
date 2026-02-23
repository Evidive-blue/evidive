//! Evidive V2 API — library crate exposing shared types and modules.
//!
//! Exposes [`create_app`] for Vercel serverless entry point and
//! [`create_pool_lazy`] for cold-start-safe database connections.

pub mod config;
pub mod error;
pub mod middleware;
pub mod models;
pub mod routes;
pub mod services;

pub use config::{Config, ConfigError};
pub use error::AppError;

use std::sync::Arc;
use std::time::Duration;

use axum::http::{header, HeaderName, Method};
use axum::Router;
use jsonwebtoken::{Algorithm, DecodingKey};
use lettre::{AsyncSmtpTransport, Tokio1Executor};
use sqlx::postgres::{PgConnectOptions, PgPoolOptions, PgSslMode};
use stripe::Client as StripeClient;
use tower_http::compression::CompressionLayer;
use axum::http::HeaderValue;
use tower_http::cors::{AllowOrigin, CorsLayer};
use tower_http::set_header::SetResponseHeaderLayer;
use tower_http::trace::TraceLayer;

/// Shared application state injected into every handler via Axum `State`.
pub struct AppState {
    pub pool: sqlx::PgPool,
    pub config: Config,
    pub mailer: Option<AsyncSmtpTransport<Tokio1Executor>>,
    pub stripe: StripeClient,
    pub jwt_decoding_key: DecodingKey,
    pub jwt_algorithm: Algorithm,
    pub jwt_issuer: String,
}

/// Create a lazy connection pool — does NOT connect at creation time.
/// The actual TCP connection happens on the first query, which avoids
/// blocking the Vercel cold-start phase (~10 s init budget).
///
/// Forces **session mode** (port 5432) for Supabase's Supavisor pooler.
/// Transaction mode (port 6543) breaks sqlx's prepared statements. Session
/// mode pins each connection to the client, so named prepared statements
/// survive across queries within the same pool connection.
///
/// Also enforces SSL (required by Supabase) and disables the prepared-
/// statement cache for safety in pooled environments.
///
/// See: <https://supabase.com/docs/guides/database/connecting-to-postgres>
pub fn create_pool_lazy(database_url: &str) -> anyhow::Result<sqlx::PgPool> {
    // If DATABASE_URL uses the transaction pooler (port 6543),
    // silently switch to the session pooler (port 5432).
    let url = if database_url.contains(":6543/") || database_url.ends_with(":6543") {
        tracing::warn!("DATABASE_URL uses transaction pooler (port 6543), switching to session pooler (port 5432)");
        database_url.replace(":6543", ":5432")
    } else {
        database_url.to_owned()
    };

    let connect_options = url
        .parse::<PgConnectOptions>()
        .map_err(|e| anyhow::anyhow!("Invalid DATABASE_URL: {e}"))?
        .statement_cache_capacity(0)
        .ssl_mode(PgSslMode::Require);

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(Duration::from_secs(10))
        .idle_timeout(Duration::from_secs(60))
        .connect_lazy_with(connect_options);

    Ok(pool)
}

/// Build the full application router with all routes and middleware.
///
/// Used by:
/// - `api/handler.rs` (Vercel serverless entry point)
/// - Can also be used in integration tests
///
/// Skips rate limiting (Vercel handles that at the edge) and migrations
/// (run separately via `sqlx migrate run`).
pub async fn create_app(pool: sqlx::PgPool, config: Config) -> anyhow::Result<Router> {
    // Fetch JWKS from Supabase for JWT verification (ES256 / ECC P-256)
    let (jwt_decoding_key, jwt_algorithm, _kid) =
        middleware::auth::fetch_jwks(&config.jwks_url())
            .await
            .map_err(|e| anyhow::anyhow!("Failed to fetch JWKS: {e}"))?;

    let jwt_issuer = format!(
        "{}/auth/v1",
        config.supabase_url.trim_end_matches('/')
    );

    // Build services
    let mailer = if config.has_smtp() {
        match services::email::build_mailer(&config) {
            Ok(m) => {
                tracing::info!("SMTP transport configured");
                Some(m)
            }
            Err(e) => {
                tracing::warn!("SMTP configuration present but transport failed: {e:?} — email disabled");
                None
            }
        }
    } else {
        tracing::info!("SMTP not configured — email features disabled");
        None
    };
    let stripe = services::stripe::build_stripe_client(&config);

    // Build CORS layer
    let cors = build_cors(&config);

    let state = Arc::new(AppState {
        pool,
        config,
        mailer,
        stripe,
        jwt_decoding_key,
        jwt_algorithm,
        jwt_issuer,
    });

    let app = Router::new()
        .route(
            "/health",
            axum::routing::get(routes::health::liveness),
        )
        .route(
            "/health/ready",
            axum::routing::get(routes::health::readiness),
        )
        .nest("/api/v1", routes::api_routes())
        .layer(cors)
        .layer(SetResponseHeaderLayer::overriding(
            HeaderName::from_static("x-content-type-options"),
            HeaderValue::from_static("nosniff"),
        ))
        .layer(SetResponseHeaderLayer::overriding(
            HeaderName::from_static("x-frame-options"),
            HeaderValue::from_static("DENY"),
        ))
        .layer(SetResponseHeaderLayer::overriding(
            HeaderName::from_static("strict-transport-security"),
            HeaderValue::from_static("max-age=63072000; includeSubDomains; preload"),
        ))
        .layer(CompressionLayer::new())
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    Ok(app)
}

/// Build a CORS layer that accepts configured origins (comma-separated)
/// plus Vercel preview/system domains for the EviDive frontend project.
fn build_cors(config: &Config) -> CorsLayer {
    let explicit: Vec<HeaderValue> = config
        .cors_origin
        .split(',')
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .filter_map(|s| s.parse().ok())
        .collect();

    CorsLayer::new()
        .allow_origin(AllowOrigin::predicate(move |origin: &HeaderValue, _| {
            if explicit.contains(origin) {
                return true;
            }
            let Ok(s) = origin.to_str() else { return false };
            s.starts_with("https://evidive") && s.ends_with(".vercel.app")
        }))
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::PATCH,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers([
            header::AUTHORIZATION,
            header::CONTENT_TYPE,
            header::ACCEPT,
            header::ACCEPT_LANGUAGE,
        ])
        .max_age(Duration::from_secs(3600))
}
