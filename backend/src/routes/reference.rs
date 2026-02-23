//! Reference data routes: countries, dive types, service categories, certifications.

use axum::{
    extract::State,
    routing::get,
    Json, Router,
};
use std::sync::Arc;

use crate::models::{CertificationRef, CountryRef, DiveTypeRef, ServiceCategoryRef};
use crate::AppState;

/// GET /api/v1/reference/countries
pub async fn list_countries(
    State(state): State<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, crate::error::AppError> {
    let rows = sqlx::query_as::<_, CountryRef>(
        "SELECT code, name_fr, name_en, name_de, name_es, name_it, name_pt, name_nl FROM ref_countries ORDER BY name_en ASC LIMIT 500",
    )
    .fetch_all(&state.pool)
    .await?;
    Ok(Json(serde_json::json!({ "data": rows })))
}

/// GET /api/v1/reference/dive-types
pub async fn list_dive_types(
    State(state): State<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, crate::error::AppError> {
    let rows = sqlx::query_as::<_, DiveTypeRef>(
        "SELECT code, name_fr, name_en, name_de, name_es, name_it, name_pt, name_nl FROM ref_dive_types ORDER BY code ASC LIMIT 200",
    )
    .fetch_all(&state.pool)
    .await?;
    Ok(Json(serde_json::json!({ "data": rows })))
}

/// GET /api/v1/reference/service-categories
pub async fn list_service_categories(
    State(state): State<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, crate::error::AppError> {
    let rows = sqlx::query_as::<_, ServiceCategoryRef>(
        "SELECT code, name_fr, name_en, name_de, name_es, name_it, name_pt, name_nl, icon FROM ref_service_categories ORDER BY code ASC LIMIT 200",
    )
    .fetch_all(&state.pool)
    .await?;
    Ok(Json(serde_json::json!({ "data": rows })))
}

/// GET /api/v1/reference/certifications
pub async fn list_certifications(
    State(state): State<Arc<AppState>>,
) -> Result<Json<serde_json::Value>, crate::error::AppError> {
    let rows = sqlx::query_as::<_, CertificationRef>(
        "SELECT code, name, organization, level FROM ref_certifications ORDER BY code ASC LIMIT 500",
    )
    .fetch_all(&state.pool)
    .await?;
    Ok(Json(serde_json::json!({ "data": rows })))
}

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/reference/countries", get(list_countries))
        .route("/reference/dive-types", get(list_dive_types))
        .route("/reference/service-categories", get(list_service_categories))
        .route("/reference/certifications", get(list_certifications))
}
