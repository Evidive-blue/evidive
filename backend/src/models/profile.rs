use chrono::{DateTime, Utc};
use serde::Serialize;
use uuid::Uuid;

/// Profile row from the `profiles` table.
/// Mapped via `sqlx::FromRow` for compile-time checked queries.
#[derive(Debug, sqlx::FromRow, Serialize)]
pub struct Profile {
    pub id: Uuid,
    pub role: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub display_name: Option<String>,
    pub avatar_url: Option<String>,
    pub phone: Option<String>,
    pub preferred_locale: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
