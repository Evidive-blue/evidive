use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};

/// Unified error type for all API handlers.
/// Every handler returns `Result<impl IntoResponse, AppError>`.
///
/// **Never** expose database errors or stack traces to the client.
/// Internal details are logged server-side via `tracing::error!`.
#[derive(Debug)]
pub enum AppError {
    /// 404 - resource not found
    NotFound(String),
    /// 400 - invalid input
    BadRequest(String),
    /// 401 - authentication required
    Unauthorized,
    /// 403 - insufficient permissions
    Forbidden,
    /// 409 - conflict (duplicate, etc.)
    Conflict(String),
    /// 500 - internal server error (details hidden from client)
    Internal(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, client_message) = match self {
            Self::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            Self::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            Self::Unauthorized => (StatusCode::UNAUTHORIZED, "Authentication required".to_owned()),
            Self::Forbidden => (StatusCode::FORBIDDEN, "Insufficient permissions".to_owned()),
            Self::Conflict(msg) => (StatusCode::CONFLICT, msg),
            Self::Internal(detail) => {
                tracing::error!(error = %detail, "Internal server error");
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "Internal server error".to_owned(),
                )
            }
        };

        (
            status,
            axum::Json(serde_json::json!({ "error": client_message })),
        )
            .into_response()
    }
}

/// Convert sqlx errors into AppError::Internal, hiding DB details from the client.
impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        Self::Internal(err.to_string())
    }
}
