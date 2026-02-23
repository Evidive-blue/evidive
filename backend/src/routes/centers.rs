use std::sync::Arc;

use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::get;
use axum::{Json, Router};
use serde::Deserialize;
use uuid::Uuid;

use crate::error::AppError;
use crate::middleware::auth::{require_center_member, AuthUser};
use crate::models::{Center, CenterSummary};
use crate::AppState;

/// Build the `/centers` sub-router.
pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route("/", get(list_centers).post(create_center))
        .route("/id/{id}", get(get_center_by_id))
        .route("/id/{id}/services", get(list_services_by_center_id))
        .route("/{slug}", get(get_center_by_slug).patch(update_center))
        .route("/geo", get(list_centers_geo))
}

// ──────────────────────── Query parameters ────────────────────────

/// Pagination + filter parameters for center listing.
#[derive(Debug, Deserialize)]
pub struct ListCentersParams {
    pub country: Option<String>,
    pub city: Option<String>,
    #[serde(default = "default_limit")]
    pub limit: i64,
    #[serde(default)]
    pub offset: i64,
}

fn default_limit() -> i64 {
    20
}

// ──────────────────────── Public endpoints ────────────────────────

/// `GET /api/v1/centers?country=FR&limit=20&offset=0`
///
/// Returns paginated active centers. Used for the search results grid.
async fn list_centers(
    State(state): State<Arc<AppState>>,
    Query(params): Query<ListCentersParams>,
) -> Result<impl IntoResponse, AppError> {
    let limit = params.limit.clamp(1, 100);
    let offset = params.offset.max(0);

    let centers: Vec<CenterSummary> = sqlx::query_as::<_, CenterSummary>(
        r#"
        SELECT id, name, slug, city, country, latitude, longitude,
               logo_url, cover_url, price_from, currency, is_featured, eco_commitment
        FROM centers
        WHERE status = 'active'
          AND deleted_at IS NULL
          AND ($1::text IS NULL OR country = $1)
          AND ($2::text IS NULL OR city ILIKE '%' || $2 || '%')
        ORDER BY is_featured DESC NULLS LAST, name ASC
        LIMIT $3 OFFSET $4
        "#,
    )
    .bind(params.country.as_deref())
    .bind(params.city.as_deref())
    .bind(limit)
    .bind(offset)
    .fetch_all(&state.pool)
    .await?;

    let total: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(*)
        FROM centers
        WHERE status = 'active'
          AND deleted_at IS NULL
          AND ($1::text IS NULL OR country = $1)
          AND ($2::text IS NULL OR city ILIKE '%' || $2 || '%')
        "#,
    )
    .bind(params.country.as_deref())
    .bind(params.city.as_deref())
    .fetch_one(&state.pool)
    .await?;

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({
            "data": centers,
            "pagination": {
                "total": total,
                "limit": limit,
                "offset": offset
            }
        })),
    ))
}

/// `GET /api/v1/centers/{slug}`
///
/// Returns full center detail by slug. Used for center profile pages.
async fn get_center_by_slug(
    State(state): State<Arc<AppState>>,
    Path(slug): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let center = sqlx::query_as::<_, Center>(
        r#"
        SELECT id, owner_id, name, slug, description, address, city, region,
               country, postal_code, latitude, longitude, email, phone, website,
               facebook_url, instagram_url, dive_types, languages, certifications,
               payment_methods, eco_commitment, opening_hours, logo_url, cover_url,
               images, price_from, currency, stripe_account_id, stripe_onboarding_complete,
               status::text AS status, is_featured, created_at, updated_at, deleted_at
        FROM centers
        WHERE slug = $1 AND status = 'active' AND deleted_at IS NULL
        "#,
    )
    .bind(&slug)
    .fetch_optional(&state.pool)
    .await?;

    match center {
        Some(c) => Ok((StatusCode::OK, Json(serde_json::json!({ "data": c })))),
        None => Err(AppError::NotFound(format!("Center '{slug}' not found"))),
    }
}

// ──────────────────────── By-ID endpoints (for frontend using UUIDs) ────────────────────────

/// Minimal center info returned by the by-ID lookup.
#[derive(Debug, sqlx::FromRow, serde::Serialize)]
struct CenterBasicInfo {
    id: Uuid,
    name: String,
    slug: String,
    city: Option<String>,
    country: String,
}

/// `GET /api/v1/centers/id/{id}` — public, get basic center info by UUID.
async fn get_center_by_id(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let center = sqlx::query_as::<_, CenterBasicInfo>(
        r#"
        SELECT id, name, slug, city, country
        FROM centers
        WHERE id = $1 AND status = 'active' AND deleted_at IS NULL
        "#,
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await?;

    match center {
        Some(c) => Ok((StatusCode::OK, Json(serde_json::json!({ "data": c })))),
        None => Err(AppError::NotFound("Center not found".to_owned())),
    }
}

/// `GET /api/v1/centers/id/{id}/services` — public, list active services by center UUID.
async fn list_services_by_center_id(
    State(state): State<Arc<AppState>>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, AppError> {
    let rows = sqlx::query_as::<_, crate::models::ServiceRow>(
        r#"
        SELECT s.id, s.center_id, s.name, s.description, s.category, s.duration_minutes,
               s.max_capacity, s.min_participants, s.price, s.currency, s.min_certification,
               s.min_dives, s.is_active
        FROM services s
        JOIN centers c ON c.id = s.center_id
        WHERE c.id = $1 AND c.status = 'active' AND c.deleted_at IS NULL
              AND s.is_active = true AND s.deleted_at IS NULL
        ORDER BY s.name ASC
        LIMIT 200
        "#,
    )
    .bind(id)
    .fetch_all(&state.pool)
    .await?;

    Ok((StatusCode::OK, Json(serde_json::json!({ "data": rows }))))
}

// ──────────────────────── Geo endpoint ────────────────────────

/// Geo parameters for globe/map endpoint.
#[derive(Debug, Deserialize)]
pub struct GeoBoundsParams {
    pub lat_min: Option<f64>,
    pub lat_max: Option<f64>,
    pub lng_min: Option<f64>,
    pub lng_max: Option<f64>,
    #[serde(default = "default_geo_limit")]
    pub limit: i64,
}

fn default_geo_limit() -> i64 {
    200
}

/// Minimal projection for globe markers (lightweight for instanced rendering).
#[derive(Debug, sqlx::FromRow, serde::Serialize)]
pub struct CenterGeoPin {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub latitude: Option<rust_decimal::Decimal>,
    pub longitude: Option<rust_decimal::Decimal>,
    pub country: String,
    pub is_featured: Option<bool>,
}

/// `GET /api/v1/centers/geo?lat_min=41&lat_max=44&lng_min=8&lng_max=10`
///
/// Returns geolocated center pins for the 3D globe / map.
async fn list_centers_geo(
    State(state): State<Arc<AppState>>,
    Query(params): Query<GeoBoundsParams>,
) -> Result<impl IntoResponse, AppError> {
    let limit = params.limit.clamp(1, 500);

    let pins: Vec<CenterGeoPin> = sqlx::query_as::<_, CenterGeoPin>(
        r#"
        SELECT id, name, slug, latitude, longitude, country, is_featured
        FROM centers
        WHERE status = 'active'
          AND deleted_at IS NULL
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
          AND ($1::float8 IS NULL OR latitude >= $1::numeric)
          AND ($2::float8 IS NULL OR latitude <= $2::numeric)
          AND ($3::float8 IS NULL OR longitude >= $3::numeric)
          AND ($4::float8 IS NULL OR longitude <= $4::numeric)
        ORDER BY is_featured DESC NULLS LAST
        LIMIT $5
        "#,
    )
    .bind(params.lat_min)
    .bind(params.lat_max)
    .bind(params.lng_min)
    .bind(params.lng_max)
    .bind(limit)
    .fetch_all(&state.pool)
    .await?;

    Ok((StatusCode::OK, Json(serde_json::json!({ "data": pins }))))
}

// ──────────────────────── Authenticated endpoints ────────────────────────

/// Body for creating a new center (diver submits for admin review).
#[derive(Debug, Deserialize)]
struct CreateCenterBody {
    name: String,
    slug: Option<String>,
    email: String,
    country: String,
    city: Option<String>,
    address: Option<String>,
    description: Option<String>,
    phone: Option<String>,
    website: Option<String>,
    postal_code: Option<String>,
    region: Option<String>,
    dive_types: Option<Vec<String>>,
    languages: Option<Vec<String>>,
    certifications: Option<Vec<String>>,
    latitude: Option<f64>,
    longitude: Option<f64>,
}

/// Generate a URL-safe slug from a center name.
fn slugify(name: &str) -> String {
    name.to_lowercase()
        .chars()
        .map(|c| match c {
            'a'..='z' | '0'..='9' => c,
            ' ' | '-' | '_' => '-',
            '\u{00e0}' | '\u{00e2}' | '\u{00e4}' => 'a',
            '\u{00e9}' | '\u{00e8}' | '\u{00ea}' | '\u{00eb}' => 'e',
            '\u{00ee}' | '\u{00ef}' => 'i',
            '\u{00f4}' | '\u{00f6}' => 'o',
            '\u{00f9}' | '\u{00fb}' | '\u{00fc}' => 'u',
            '\u{00e7}' => 'c',
            '\u{00f1}' => 'n',
            _ => '-',
        })
        .collect::<String>()
        .split('-')
        .filter(|s| !s.is_empty())
        .collect::<Vec<&str>>()
        .join("-")
}

/// `POST /api/v1/centers`
///
/// Any authenticated diver can create a center. Status starts as `pending`.
/// The creating diver is automatically added to `tli_pr_ce` as center member.
async fn create_center(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Json(body): Json<CreateCenterBody>,
) -> Result<impl IntoResponse, AppError> {
    let name = body.name.trim();
    if name.is_empty() {
        return Err(AppError::BadRequest("Center name is required".to_owned()));
    }

    // Generate slug from name if not provided
    let slug = match body.slug.as_deref() {
        Some(s) if !s.trim().is_empty() => s.trim().to_lowercase(),
        _ => slugify(name),
    };
    if slug.len() < 3 {
        return Err(AppError::BadRequest(
            "Slug must be at least 3 characters".to_owned(),
        ));
    }

    let email = body.email.trim();
    if !is_valid_email(email) {
        return Err(AppError::BadRequest(
            "Invalid email address format".to_owned(),
        ));
    }

    // Check slug uniqueness; if taken, append a short suffix
    let mut final_slug = slug.clone();
    let slug_exists: bool =
        sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM centers WHERE slug = $1 AND deleted_at IS NULL)")
            .bind(&final_slug)
            .fetch_one(&state.pool)
            .await?;

    if slug_exists {
        // Append a short random suffix to make it unique
        let suffix = &Uuid::new_v4().to_string()[..6];
        final_slug = format!("{slug}-{suffix}");
    }

    // Insert center + junction table in a transaction
    let mut tx = state.pool.begin().await?;

    let center_id: Uuid = sqlx::query_scalar(
        r#"
        INSERT INTO centers (
            owner_id, name, slug, email, country, city, address, description,
            phone, website, postal_code, region, dive_types, languages,
            certifications, latitude, longitude, status
        )
        VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12, $13, $14,
            $15, $16, $17, 'pending'
        )
        RETURNING id
        "#,
    )
    .bind(claims.sub)
    .bind(name)
    .bind(&final_slug)
    .bind(email)
    .bind(body.country.trim())
    .bind(body.city.as_deref().map(str::trim))
    .bind(body.address.as_deref().map(str::trim))
    .bind(body.description.as_deref().map(str::trim))
    .bind(body.phone.as_deref().map(str::trim))
    .bind(body.website.as_deref().map(str::trim))
    .bind(body.postal_code.as_deref().map(str::trim))
    .bind(body.region.as_deref().map(str::trim))
    .bind(&body.dive_types)
    .bind(&body.languages)
    .bind(&body.certifications)
    .bind(body.latitude.and_then(|v| sqlx::types::Decimal::try_from(v).ok()))
    .bind(body.longitude.and_then(|v| sqlx::types::Decimal::try_from(v).ok()))
    .fetch_one(&mut *tx)
    .await
    .map_err(|err| {
        // Catch unique violation (SQLSTATE 23505) for slug race condition
        if let sqlx::Error::Database(ref db_err) = err {
            if db_err.code().as_deref() == Some("23505") {
                return AppError::Conflict(format!(
                    "A center with slug '{final_slug}' already exists"
                ));
            }
        }
        AppError::Internal(err.to_string())
    })?;

    // Link the creating diver to the center via junction table
    sqlx::query("INSERT INTO tli_pr_ce (fk_profile, fk_center, role_in_center) VALUES ($1, $2, 'owner')")
        .bind(claims.sub)
        .bind(center_id)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;

    Ok((
        StatusCode::CREATED,
        Json(serde_json::json!({
            "data": { "id": center_id, "slug": final_slug, "status": "pending" }
        })),
    ))
}

/// Body for updating a center (only center members).
#[derive(Debug, Deserialize)]
struct UpdateCenterBody {
    name: Option<String>,
    description: Option<String>,
    address: Option<String>,
    city: Option<String>,
    region: Option<String>,
    postal_code: Option<String>,
    country: Option<String>,
    phone: Option<String>,
    website: Option<String>,
    email: Option<String>,
    facebook_url: Option<String>,
    instagram_url: Option<String>,
    logo_url: Option<String>,
    cover_url: Option<String>,
    dive_types: Option<Vec<String>>,
    languages: Option<Vec<String>>,
    certifications: Option<Vec<String>>,
    payment_methods: Option<Vec<String>>,
    eco_commitment: Option<bool>,
    opening_hours: Option<serde_json::Value>,
    price_from: Option<f64>,
    currency: Option<String>,
    latitude: Option<f64>,
    longitude: Option<f64>,
}

/// `PATCH /api/v1/centers/{slug}`
///
/// Center members can update their center's editable fields.
async fn update_center(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(slug): Path<String>,
    Json(body): Json<UpdateCenterBody>,
) -> Result<impl IntoResponse, AppError> {
    // Resolve slug to center ID
    let center_id: Option<Uuid> =
        sqlx::query_scalar("SELECT id FROM centers WHERE slug = $1 AND deleted_at IS NULL")
            .bind(&slug)
            .fetch_optional(&state.pool)
            .await?;

    let center_id =
        center_id.ok_or_else(|| AppError::NotFound(format!("Center '{slug}' not found")))?;

    // Verify the user is a member of this center
    require_center_member(&state.pool, claims.sub, center_id).await?;

    sqlx::query(
        r#"
        UPDATE centers
        SET name           = COALESCE($1, name),
            description    = COALESCE($2, description),
            address        = COALESCE($3, address),
            city           = COALESCE($4, city),
            region         = COALESCE($5, region),
            postal_code    = COALESCE($6, postal_code),
            country        = COALESCE($7, country),
            phone          = COALESCE($8, phone),
            website        = COALESCE($9, website),
            email          = COALESCE($10, email),
            facebook_url   = COALESCE($11, facebook_url),
            instagram_url  = COALESCE($12, instagram_url),
            logo_url       = COALESCE($13, logo_url),
            cover_url      = COALESCE($14, cover_url),
            dive_types     = COALESCE($15, dive_types),
            languages      = COALESCE($16, languages),
            certifications = COALESCE($17, certifications),
            payment_methods= COALESCE($18, payment_methods),
            eco_commitment = COALESCE($19, eco_commitment),
            opening_hours  = COALESCE($20, opening_hours),
            price_from     = COALESCE($21, price_from),
            currency       = COALESCE($22, currency),
            latitude       = COALESCE($23, latitude),
            longitude      = COALESCE($24, longitude),
            updated_at     = NOW()
        WHERE id = $25 AND deleted_at IS NULL
        "#,
    )
    .bind(body.name.as_deref().map(str::trim))
    .bind(body.description.as_deref().map(str::trim))
    .bind(body.address.as_deref().map(str::trim))
    .bind(body.city.as_deref().map(str::trim))
    .bind(body.region.as_deref().map(str::trim))
    .bind(body.postal_code.as_deref().map(str::trim))
    .bind(body.country.as_deref().map(str::trim))
    .bind(body.phone.as_deref().map(str::trim))
    .bind(body.website.as_deref().map(str::trim))
    .bind(body.email.as_deref().map(str::trim))
    .bind(body.facebook_url.as_deref())
    .bind(body.instagram_url.as_deref())
    .bind(body.logo_url.as_deref())
    .bind(body.cover_url.as_deref())
    .bind(&body.dive_types)
    .bind(&body.languages)
    .bind(&body.certifications)
    .bind(&body.payment_methods)
    .bind(body.eco_commitment)
    .bind(&body.opening_hours)
    .bind(body.price_from.and_then(|v| sqlx::types::Decimal::try_from(v).ok()))
    .bind(body.currency.as_deref().map(str::trim))
    .bind(body.latitude.and_then(|v| sqlx::types::Decimal::try_from(v).ok()))
    .bind(body.longitude.and_then(|v| sqlx::types::Decimal::try_from(v).ok()))
    .bind(center_id)
    .execute(&state.pool)
    .await?;

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({ "message": "Center updated" })),
    ))
}

/// Basic email validation (checks structure, not just `contains('@')`).
fn is_valid_email(email: &str) -> bool {
    let parts: Vec<&str> = email.splitn(2, '@').collect();
    if parts.len() != 2 {
        return false;
    }
    // SAFETY: splitn(2) with len() == 2 guarantees both indices exist
    let local = parts[0];
    let domain = parts[1];

    !local.is_empty()
        && !domain.is_empty()
        && domain.contains('.')
        && !domain.starts_with('.')
        && !domain.ends_with('.')
        && !local.contains(' ')
        && !domain.contains(' ')
}
