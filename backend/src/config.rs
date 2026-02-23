use std::env;

/// Typed application configuration loaded from environment variables.
/// Core fields are required at startup; SMTP is optional (email features
/// are gracefully disabled when SMTP is not configured).
#[derive(Clone)]
pub struct Config {
    pub port: u16,
    pub database_url: String,
    pub supabase_url: String,
    pub supabase_publishable_key: String,
    pub cors_origin: String,
    pub stripe_secret_key: String,
    pub stripe_webhook_secret: String,
    pub smtp_host: Option<String>,
    pub smtp_port: u16,
    pub smtp_user: Option<String>,
    pub smtp_pass: Option<String>,
    pub smtp_from: Option<String>,
}

impl Config {
    /// Build config from environment variables.
    /// Returns a descriptive error for each missing variable.
    pub fn from_env() -> Result<Self, ConfigError> {
        Ok(Self {
            port: parse_env("PORT", "8080")?,
            database_url: require_env("DATABASE_URL")?,
            supabase_url: require_env("SUPABASE_URL")?,
            supabase_publishable_key: require_env("SUPABASE_PUBLISHABLE_KEY")?,
            cors_origin: require_env("CORS_ORIGIN")?,
            stripe_secret_key: require_env("STRIPE_SECRET_KEY")?,
            stripe_webhook_secret: require_env("STRIPE_WEBHOOK_SECRET")?,
            smtp_host: optional_env("SMTP_HOST"),
            smtp_port: parse_env("SMTP_PORT", "587")?,
            smtp_user: optional_env("SMTP_USER"),
            smtp_pass: optional_env("SMTP_PASS"),
            smtp_from: optional_env("SMTP_FROM"),
        })
    }

    /// Returns `true` when all SMTP variables are configured.
    pub fn has_smtp(&self) -> bool {
        self.smtp_host.is_some()
            && self.smtp_user.is_some()
            && self.smtp_pass.is_some()
            && self.smtp_from.is_some()
    }

    /// Derive the JWKS URL from the Supabase project URL.
    /// Supabase exposes public signing keys at `/auth/v1/.well-known/jwks.json`.
    pub fn jwks_url(&self) -> String {
        format!(
            "{}/auth/v1/.well-known/jwks.json",
            self.supabase_url.trim_end_matches('/')
        )
    }
}

/// Errors that can occur when loading configuration.
#[derive(Debug, thiserror::Error)]
pub enum ConfigError {
    #[error("Missing required environment variable: {0}")]
    MissingVar(String),
    #[error("Invalid value for environment variable {var}: {source}")]
    InvalidValue {
        var: String,
        source: Box<dyn std::error::Error + Send + Sync>,
    },
}

fn require_env(key: &str) -> Result<String, ConfigError> {
    env::var(key).map_err(|_| ConfigError::MissingVar(key.to_owned()))
}

fn optional_env(key: &str) -> Option<String> {
    env::var(key).ok().filter(|v| !v.is_empty())
}

fn parse_env<T>(key: &str, default: &str) -> Result<T, ConfigError>
where
    T: std::str::FromStr,
    T::Err: std::error::Error + Send + Sync + 'static,
{
    let raw = env::var(key).unwrap_or_else(|_| default.to_owned());
    raw.parse().map_err(|e: T::Err| ConfigError::InvalidValue {
        var: key.to_owned(),
        source: Box::new(e),
    })
}
