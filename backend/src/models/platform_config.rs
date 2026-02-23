//! Platform configuration model for admin-managed settings stored in DB.

use chrono::{DateTime, Utc};
use serde::Serialize;
use uuid::Uuid;

/// A platform configuration entry from `t_platform_config`.
#[derive(Debug, sqlx::FromRow, Serialize)]
pub struct PlatformConfig {
    pub key: String,
    pub value: String,
    pub category: String,
    pub is_secret: bool,
    pub description: Option<String>,
    pub updated_at: DateTime<Utc>,
    pub updated_by: Option<Uuid>,
}
