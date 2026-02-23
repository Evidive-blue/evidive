use std::sync::Arc;

use axum::extract::State;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::post;
use axum::Router;
use lettre::message::header::ContentType;
use lettre::message::Mailbox;
use lettre::{AsyncTransport, Message};
use serde::Deserialize;

use crate::error::AppError;
use crate::AppState;

#[derive(Debug, Deserialize)]
pub struct ContactRequest {
    name: String,
    email: String,
    subject: String,
    message: String,
}

pub fn router() -> Router<Arc<AppState>> {
    Router::new().route("/contact", post(submit_contact))
}

async fn submit_contact(
    State(state): State<Arc<AppState>>,
    axum::Json(payload): axum::Json<ContactRequest>,
) -> Result<impl IntoResponse, AppError> {
    if payload.name.trim().is_empty()
        || payload.email.trim().is_empty()
        || payload.subject.trim().is_empty()
        || payload.message.trim().is_empty()
    {
        return Err(AppError::BadRequest(
            "All fields are required".to_owned(),
        ));
    }

    if !payload.email.contains('@') || !payload.email.contains('.') {
        return Err(AppError::BadRequest("Invalid email address".to_owned()));
    }

    let mailer = state
        .mailer
        .as_ref()
        .ok_or_else(|| AppError::Internal("Email service is not configured".to_owned()))?;

    let smtp_from = state
        .config
        .smtp_from
        .as_deref()
        .ok_or_else(|| AppError::Internal("SMTP_FROM is not configured".to_owned()))?;

    let from: Mailbox = smtp_from
        .parse()
        .map_err(|e| AppError::Internal(format!("Invalid SMTP_FROM: {e}")))?;

    let reply_to: Mailbox = payload
        .email
        .parse()
        .map_err(|_| AppError::BadRequest("Invalid email address".to_owned()))?;

    let to: Mailbox = smtp_from
        .parse()
        .map_err(|e| AppError::Internal(format!("Invalid SMTP_FROM for recipient: {e}")))?;

    let body = format!(
        "New contact form submission\n\
         \n\
         Name: {}\n\
         Email: {}\n\
         Subject: {}\n\
         \n\
         Message:\n\
         {}",
        payload.name, payload.email, payload.subject, payload.message
    );

    let email = Message::builder()
        .from(from)
        .reply_to(reply_to)
        .to(to)
        .subject(format!("[EviDive Contact] {}", payload.subject))
        .header(ContentType::TEXT_PLAIN)
        .body(body)
        .map_err(|e| AppError::Internal(format!("Failed to build email: {e}")))?;

    mailer
        .send(email)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to send email: {e}")))?;

    Ok((
        StatusCode::OK,
        axum::Json(serde_json::json!({ "status": "sent" })),
    ))
}
