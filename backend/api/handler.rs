//! Evidive Backend — Vercel Serverless Entry Point
//!
//! Wraps the full Axum application in a single serverless function.
//! All requests are routed here via `vercel.json` rewrites.
//!
//! Cold-start budget is ~10 s. We use `connect_lazy` so the DB pool
//! is created instantly (no TCP handshake). The actual connection
//! happens on the first query.
//!
//! Migrations are NOT run on cold start — run them via CLI:
//!   `sqlx migrate run --database-url $DATABASE_URL`

use tower::ServiceBuilder;
use vercel_runtime::axum::VercelLayer;
use vercel_runtime::Error;

use evidive_api::config::Config;
use evidive_api::{create_app, create_pool_lazy};

#[tokio::main]
async fn main() -> Result<(), Error> {
    // Minimal tracing — avoid env filter parsing that could panic on cold start
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .without_time()
        .init();

    tracing::info!("Evidive API handler starting (Vercel serverless)");

    // Load config from Vercel environment variables
    let config = match Config::from_env() {
        Ok(c) => c,
        Err(e) => {
            tracing::error!("Config::from_env() failed: {e:#}");
            return Err(e.into());
        }
    };

    tracing::info!("Config loaded successfully");

    // Create a LAZY pool — no TCP connection happens here.
    // The actual connection is deferred to the first query.
    let pool = match create_pool_lazy(&config.database_url) {
        Ok(p) => {
            tracing::info!("Lazy pool created (connection deferred to first query)");
            p
        }
        Err(e) => {
            tracing::error!("create_pool_lazy failed: {e:#}");
            return Err(Error::from(format!("Pool creation failed: {e:#}")));
        }
    };

    // Build the full application router (health, auth, centers, bookings, etc.)
    // This also fetches JWKS from Supabase for JWT verification.
    let router = match create_app(pool, config).await {
        Ok(r) => {
            tracing::info!("Router created, starting vercel_runtime::run");
            r
        }
        Err(e) => {
            tracing::error!("create_app failed: {e:#}");
            return Err(Error::from(format!("create_app failed: {e:#}")));
        }
    };

    let app = ServiceBuilder::new()
        .layer(VercelLayer::new())
        .service(router);

    vercel_runtime::run(app).await
}
