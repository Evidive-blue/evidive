//! Evidive V2 API — Local development entry point.
//!
//! For Vercel deployment, see `api/handler.rs`.

use std::net::SocketAddr;
use std::time::Duration;

use sqlx::postgres::{PgConnectOptions, PgPoolOptions};
use tower_governor::governor::GovernorConfigBuilder;
use tower_governor::key_extractor::SmartIpKeyExtractor;
use tower_governor::GovernorLayer;

use evidive_api::config::Config;

#[tokio::main]
async fn main() {
    // Load .env in development; silently skip if missing (prod uses real env vars)
    let _ = dotenvy::dotenv();

    // Initialize structured logging from RUST_LOG env var (defaults to info)
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "evidive_api=info,tower_http=info".into()),
        )
        .json()
        .init();

    // Load typed config
    // SAFETY: Application cannot start without valid configuration; crashing is the correct behavior.
    let config = Config::from_env().expect("Failed to load configuration from environment");

    let port = config.port;

    // Connect to Supabase PostgreSQL (eager connection for local dev).
    // Disable the prepared-statement cache because Supavisor in transaction
    // mode (port 6543) reassigns connections between requests, making cached
    // prepared statements invisible to subsequent queries.
    let connect_options = config
        .database_url
        .parse::<PgConnectOptions>()
        // SAFETY: Application cannot start without a valid DATABASE_URL; crashing is correct.
        .expect("Invalid DATABASE_URL")
        .statement_cache_capacity(0);

    let pool = PgPoolOptions::new()
        .max_connections(20)
        .acquire_timeout(Duration::from_secs(5))
        .connect_with(connect_options)
        .await
        // SAFETY: Application cannot serve requests without a database connection; crashing is the correct behavior.
        .expect("Failed to connect to database");

    tracing::info!("Database connection pool established");

    // Run pending migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        // SAFETY: Running with an outdated schema would cause runtime errors; crashing ensures integrity.
        .expect("Failed to run database migrations");

    tracing::info!("Database migrations applied");

    // Build the full application router via the shared create_app function
    let app = evidive_api::create_app(pool, config)
        .await
        // SAFETY: If the app cannot build (e.g. JWKS unreachable), the server cannot function.
        .expect("Failed to build application");

    // Rate limiting per IP (production only).
    // In debug builds the rate limiter is skipped entirely to avoid blocking
    // during rapid HMR reloads, SSR prefetches and parallel dev tool requests.
    let app = if cfg!(debug_assertions) {
        tracing::info!("Rate limiter DISABLED (debug build)");
        axum::Router::new().merge(app)
    } else {
        let governor_conf = GovernorConfigBuilder::default()
            .per_second(1)
            .burst_size(30)
            .key_extractor(SmartIpKeyExtractor)
            .use_headers()
            .finish()
            // SAFETY: Rate limiting protects against abuse; startup must fail if configuration is invalid.
            .expect("Failed to build rate limiter configuration");

        // Background task to clean up expired rate-limiter entries
        let governor_limiter = governor_conf.limiter().clone();
        let cleanup_interval = Duration::from_secs(60);
        std::thread::spawn(move || loop {
            std::thread::sleep(cleanup_interval);
            governor_limiter.retain_recent();
        });

        axum::Router::new()
            .merge(app)
            .layer(GovernorLayer::new(governor_conf))
    };

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!(%addr, "Starting Evidive API server");

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        // SAFETY: If the port is unavailable, the server cannot accept connections; must fail loudly.
        .expect("Failed to bind TCP listener");

    // into_make_service_with_connect_info provides peer IP to rate limiter
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .await
    // SAFETY: Fatal server error (e.g. panic in Hyper); crashing is the only option.
    .expect("Server error");
}
