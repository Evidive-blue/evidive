//! Service model for list-by-center.

use rust_decimal::Decimal;
use serde::Serialize;
use uuid::Uuid;

/// Active service for a center.
/// Types tightened to match DB NOT NULL constraints.
#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct ServiceRow {
    pub id: Uuid,
    pub center_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub category: Option<String>,
    pub duration_minutes: i32,
    pub max_capacity: i32,
    pub min_participants: Option<i32>,
    pub price: Decimal,
    pub currency: Option<String>,
    pub min_certification: Option<String>,
    pub min_dives: Option<i32>,
    pub is_active: Option<bool>,
}
