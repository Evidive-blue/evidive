//! Center members routes: manage users linked to a center via tli_pr_ce.
//!
//! Only center owners can add, update, or remove members.
//! All center members can list members.

use std::sync::Arc;

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::get;
use axum::{Json, Router};
use serde::Deserialize;
use uuid::Uuid;

use crate::error::AppError;
use crate::middleware::auth::{require_center_member, require_center_owner, AuthUser};
use crate::AppState;

/// Resolve slug to center_id.
async fn resolve_center_id(pool: &sqlx::PgPool, slug: &str) -> Result<Uuid, AppError> {
    sqlx::query_scalar("SELECT id FROM centers WHERE slug = $1 AND deleted_at IS NULL")
        .bind(slug)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound(format!("Center '{slug}' not found")))
}

pub fn router() -> Router<Arc<AppState>> {
    Router::new()
        .route(
            "/centers/{slug}/members",
            get(list_members).post(add_member),
        )
        .route(
            "/centers/{slug}/members/{member_id}",
            axum::routing::patch(update_member_role).delete(remove_member),
        )
}

// ──────────────────────── Types ────────────────────────

#[derive(Debug, serde::Serialize, sqlx::FromRow)]
struct MemberRow {
    id: Uuid,
    fk_profile: Uuid,
    fk_center: Uuid,
    role_in_center: String,
    created_at: chrono::DateTime<chrono::Utc>,
    /// Joined from profiles table
    profile_email: Option<String>,
    profile_first_name: Option<String>,
    profile_last_name: Option<String>,
}

// ──────────────────────── List ────────────────────────

/// `GET /api/v1/centers/{slug}/members`
async fn list_members(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(slug): Path<String>,
) -> Result<impl IntoResponse, AppError> {
    let center_id = resolve_center_id(&state.pool, &slug).await?;
    require_center_member(&state.pool, claims.sub, center_id).await?;

    let rows = sqlx::query_as::<_, MemberRow>(
        r#"
        SELECT
            m.id,
            m.fk_profile,
            m.fk_center,
            m.role_in_center,
            m.created_at,
            u.email AS profile_email,
            p.first_name AS profile_first_name,
            p.last_name AS profile_last_name
        FROM tli_pr_ce m
        JOIN auth.users u ON u.id = m.fk_profile
        LEFT JOIN profiles p ON p.id = m.fk_profile
        WHERE m.fk_center = $1
        ORDER BY m.role_in_center ASC, p.first_name ASC
        "#,
    )
    .bind(center_id)
    .fetch_all(&state.pool)
    .await?;

    Ok((StatusCode::OK, Json(serde_json::json!({ "data": rows }))))
}

// ──────────────────────── Add member ────────────────────────

#[derive(Debug, Deserialize)]
struct AddMemberBody {
    /// Email of the user to add. Must be an existing profile.
    email: String,
    /// Role to assign: "employee", "manager", etc. Cannot be "owner".
    role_in_center: String,
}

/// `POST /api/v1/centers/{slug}/members`
///
/// Only the center owner can add members.
async fn add_member(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path(slug): Path<String>,
    Json(body): Json<AddMemberBody>,
) -> Result<impl IntoResponse, AppError> {
    let center_id = resolve_center_id(&state.pool, &slug).await?;
    require_center_owner(&state.pool, claims.sub, center_id).await?;

    let email = body.email.trim().to_lowercase();
    if email.is_empty() {
        return Err(AppError::BadRequest(
            "Email is required".to_owned(),
        ));
    }

    let role = body.role_in_center.trim().to_lowercase();
    if role == "owner" {
        return Err(AppError::BadRequest(
            "Cannot assign 'owner' role. Transfer ownership is not yet supported.".to_owned(),
        ));
    }
    let allowed_roles = ["employee", "manager"];
    if !allowed_roles.contains(&role.as_str()) {
        return Err(AppError::BadRequest(format!(
            "Invalid role '{}'. Allowed: {}",
            role,
            allowed_roles.join(", ")
        )));
    }

    // Find the user by email in auth.users, then verify they have a profile
    let profile_id: Option<Uuid> = sqlx::query_scalar(
        r#"
        SELECT u.id FROM auth.users u
        JOIN profiles p ON p.id = u.id AND p.deleted_at IS NULL
        WHERE LOWER(u.email) = $1
        "#,
    )
    .bind(&email)
    .fetch_optional(&state.pool)
    .await?;

    let profile_id = profile_id.ok_or_else(|| {
        AppError::NotFound(format!(
            "No user found with email '{email}'. They must create an account first."
        ))
    })?;

    // Check if already a member
    let exists: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM tli_pr_ce WHERE fk_profile = $1 AND fk_center = $2)",
    )
    .bind(profile_id)
    .bind(center_id)
    .fetch_one(&state.pool)
    .await?;

    if exists {
        return Err(AppError::BadRequest(
            "This user is already a member of this center.".to_owned(),
        ));
    }

    // Add the member
    let id: Uuid = sqlx::query_scalar(
        r#"
        INSERT INTO tli_pr_ce (fk_profile, fk_center, role_in_center)
        VALUES ($1, $2, $3)
        RETURNING id
        "#,
    )
    .bind(profile_id)
    .bind(center_id)
    .bind(&role)
    .fetch_one(&state.pool)
    .await?;

    Ok((
        StatusCode::CREATED,
        Json(serde_json::json!({
            "data": {
                "id": id,
                "fk_profile": profile_id,
                "fk_center": center_id,
                "role_in_center": role
            }
        })),
    ))
}

// ──────────────────────── Update role ────────────────────────

#[derive(Debug, Deserialize)]
struct UpdateRoleBody {
    role_in_center: String,
}

/// `PATCH /api/v1/centers/{slug}/members/{member_id}`
///
/// Only the center owner can update a member's role.
async fn update_member_role(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path((slug, member_id)): Path<(String, Uuid)>,
    Json(body): Json<UpdateRoleBody>,
) -> Result<impl IntoResponse, AppError> {
    let center_id = resolve_center_id(&state.pool, &slug).await?;
    require_center_owner(&state.pool, claims.sub, center_id).await?;

    let role = body.role_in_center.trim().to_lowercase();
    if role == "owner" {
        return Err(AppError::BadRequest(
            "Cannot assign 'owner' role via this endpoint.".to_owned(),
        ));
    }
    let allowed_roles = ["employee", "manager"];
    if !allowed_roles.contains(&role.as_str()) {
        return Err(AppError::BadRequest(format!(
            "Invalid role '{}'. Allowed: {}",
            role,
            allowed_roles.join(", ")
        )));
    }

    // Prevent modifying the owner's own membership
    let target_profile: Option<Uuid> = sqlx::query_scalar(
        "SELECT fk_profile FROM tli_pr_ce WHERE id = $1 AND fk_center = $2",
    )
    .bind(member_id)
    .bind(center_id)
    .fetch_optional(&state.pool)
    .await?;

    let target_profile =
        target_profile.ok_or_else(|| AppError::NotFound("Member not found".to_owned()))?;

    if target_profile == claims.sub {
        return Err(AppError::BadRequest(
            "You cannot change your own role.".to_owned(),
        ));
    }

    let result = sqlx::query(
        "UPDATE tli_pr_ce SET role_in_center = $1 WHERE id = $2 AND fk_center = $3",
    )
    .bind(&role)
    .bind(member_id)
    .bind(center_id)
    .execute(&state.pool)
    .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Member not found".to_owned()));
    }

    Ok((
        StatusCode::OK,
        Json(serde_json::json!({ "message": "Role updated" })),
    ))
}

// ──────────────────────── Remove member ────────────────────────

/// `DELETE /api/v1/centers/{slug}/members/{member_id}`
///
/// Only the center owner can remove members. The owner cannot remove themselves.
async fn remove_member(
    State(state): State<Arc<AppState>>,
    AuthUser(claims): AuthUser,
    Path((slug, member_id)): Path<(String, Uuid)>,
) -> Result<impl IntoResponse, AppError> {
    let center_id = resolve_center_id(&state.pool, &slug).await?;
    require_center_owner(&state.pool, claims.sub, center_id).await?;

    // Prevent the owner from removing themselves
    let target_profile: Option<Uuid> = sqlx::query_scalar(
        "SELECT fk_profile FROM tli_pr_ce WHERE id = $1 AND fk_center = $2",
    )
    .bind(member_id)
    .bind(center_id)
    .fetch_optional(&state.pool)
    .await?;

    let target_profile =
        target_profile.ok_or_else(|| AppError::NotFound("Member not found".to_owned()))?;

    if target_profile == claims.sub {
        return Err(AppError::BadRequest(
            "You cannot remove yourself from the center.".to_owned(),
        ));
    }

    let result = sqlx::query("DELETE FROM tli_pr_ce WHERE id = $1 AND fk_center = $2")
        .bind(member_id)
        .bind(center_id)
        .execute(&state.pool)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Member not found".to_owned()));
    }

    Ok(StatusCode::NO_CONTENT)
}
