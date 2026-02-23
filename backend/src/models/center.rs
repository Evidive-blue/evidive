use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::Serialize;
use uuid::Uuid;

/// Full center row from the `centers` table.
/// All 35 columns aligned with DB schema.
#[derive(Debug, sqlx::FromRow, Serialize)]
pub struct Center {
    pub id: Uuid,
    pub owner_id: Uuid,
    pub name: String,
    pub slug: String,
    pub description: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub region: Option<String>,
    pub country: String,
    pub postal_code: Option<String>,
    pub latitude: Option<Decimal>,
    pub longitude: Option<Decimal>,
    pub email: String,
    pub phone: Option<String>,
    pub website: Option<String>,
    pub facebook_url: Option<String>,
    pub instagram_url: Option<String>,
    pub dive_types: Option<Vec<String>>,
    pub languages: Option<Vec<String>>,
    pub certifications: Option<Vec<String>>,
    pub payment_methods: Option<Vec<String>>,
    pub eco_commitment: Option<bool>,
    pub opening_hours: Option<serde_json::Value>,
    pub logo_url: Option<String>,
    pub cover_url: Option<String>,
    pub images: Option<Vec<String>>,
    pub price_from: Option<Decimal>,
    pub currency: Option<String>,
    pub stripe_account_id: Option<String>,
    pub stripe_onboarding_complete: Option<bool>,
    pub status: String,
    pub is_featured: Option<bool>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub deleted_at: Option<DateTime<Utc>>,
}

/// Lightweight center projection for list endpoints (search results).
/// Only the fields needed for a summary card.
#[derive(Debug, sqlx::FromRow, Serialize)]
pub struct CenterSummary {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub city: Option<String>,
    pub country: String,
    pub latitude: Option<Decimal>,
    pub longitude: Option<Decimal>,
    pub logo_url: Option<String>,
    pub cover_url: Option<String>,
    pub price_from: Option<Decimal>,
    pub currency: Option<String>,
    pub is_featured: Option<bool>,
    pub eco_commitment: Option<bool>,
}

/// Center summary for diver dashboard (profile/centers). Includes status for badge display.
#[derive(Debug, sqlx::FromRow, Serialize)]
pub struct ProfileCenterSummary {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub city: Option<String>,
    pub country: String,
    pub latitude: Option<Decimal>,
    pub longitude: Option<Decimal>,
    pub logo_url: Option<String>,
    pub cover_url: Option<String>,
    pub price_from: Option<Decimal>,
    pub currency: Option<String>,
    pub is_featured: Option<bool>,
    pub eco_commitment: Option<bool>,
    pub status: String,
}
