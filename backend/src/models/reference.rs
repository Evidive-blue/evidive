//! Reference data models (countries, dive types, categories, certifications).
//! Types tightened: NOT NULL columns use non-Option types.
//! All 7 locale columns included.

use serde::Serialize;

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct CountryRef {
    pub code: String,
    pub name_fr: String,
    pub name_en: String,
    pub name_de: String,
    pub name_es: String,
    pub name_it: String,
    pub name_pt: String,
    pub name_nl: String,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct DiveTypeRef {
    pub code: String,
    pub name_fr: String,
    pub name_en: String,
    pub name_de: String,
    pub name_es: String,
    pub name_it: String,
    pub name_pt: String,
    pub name_nl: String,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct ServiceCategoryRef {
    pub code: String,
    pub name_fr: String,
    pub name_en: String,
    pub name_de: String,
    pub name_es: String,
    pub name_it: String,
    pub name_pt: String,
    pub name_nl: String,
    pub icon: Option<String>,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct CertificationRef {
    pub code: String,
    pub name: String,
    pub organization: String,
    pub level: Option<i32>,
}
