use std::sync::Arc;

use axum::extract::State;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;

use crate::AppState;

/// `GET /health` -- liveness probe.
/// Returns 200 if the process is running. No dependency check.
pub async fn liveness() -> impl IntoResponse {
    (StatusCode::OK, Json(serde_json::json!({ "status": "alive" })))
}

/// `GET /health/ready` -- readiness probe.
/// Verifies the database connection is healthy before accepting traffic.
pub async fn readiness(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let db_ok = sqlx::query_scalar::<_, i32>("SELECT 1")
        .fetch_one(&state.pool)
        .await;

    match db_ok {
        Ok(_) => (
            StatusCode::OK,
            Json(serde_json::json!({ "status": "ready", "database": "connected" })),
        ),
        Err(e) => {
            tracing::error!(error = %e, "Readiness check failed: database unreachable");
            (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(serde_json::json!({ "status": "not_ready", "database": "unreachable" })),
            )
        }
    }
}
