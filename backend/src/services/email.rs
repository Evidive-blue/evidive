use lettre::transport::smtp::authentication::Credentials;
use lettre::{AsyncSmtpTransport, Tokio1Executor};

use crate::config::Config;
use crate::error::AppError;

/// Build an SMTP transport from the app config.
/// The transport is stored in `AppState` and used by handlers
/// via `state.mailer` with `lettre::AsyncTransport::send`.
pub fn build_mailer(config: &Config) -> Result<AsyncSmtpTransport<Tokio1Executor>, AppError> {
    let host = config.smtp_host.as_deref().unwrap_or_default();
    let user = config.smtp_user.clone().unwrap_or_default();
    let pass = config.smtp_pass.clone().unwrap_or_default();
    let creds = Credentials::new(user, pass);

    // SAFETY: `build_mailer` is only called when `config.has_smtp()` is true,
    // so the unwrap_or_default values above are never actually empty.
    let transport = AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(host)
        .map_err(|e| AppError::Internal(format!("SMTP relay error: {e}")))?
        .port(config.smtp_port)
        .credentials(creds)
        .build();

    Ok(transport)
}
