pub mod admin;
pub mod admin_advanced;
pub mod admin_settings;
pub mod bookings;
pub mod centers;
pub mod contact;
pub mod coupons;
pub mod dashboard;
pub mod health;
pub mod members;
pub mod payments;
pub mod profile;
pub mod reference;
pub mod reviews;
pub mod services;
pub mod staff;
pub mod stripe_connect;
pub mod webhook;

use std::sync::Arc;

use axum::Router;

use crate::AppState;

/// Build the versioned API router mounted at `/api/v1`.
pub fn api_routes() -> Router<Arc<AppState>> {
    Router::new()
        .nest("/centers", centers::router())
        .nest("/profile", profile::router())
        .nest("/admin", admin::router())
        .merge(reference::router())
        .merge(services::router())
        .merge(bookings::router())
        .merge(reviews::router())
        .merge(dashboard::router())
        .merge(staff::router())
        .merge(members::router())
        .merge(coupons::router())
        .merge(stripe_connect::router())
        .merge(payments::router())
        .merge(contact::router())
        .nest("/stripe", webhook::router())
}
