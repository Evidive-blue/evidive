use axum::routing::get;
use axum::Router;
use http::Request;
use http_body_util::BodyExt;
use tower::ServiceExt;

/// T-13: GET /health returns 200 with `{"status":"alive"}`.
///
/// Uses tower `oneshot` — no database or external service required.
#[tokio::test]
async fn health_liveness_returns_200() {
    let app: Router = Router::new().route(
        "/health",
        get(evidive_api::routes::health::liveness),
    );

    let req = Request::builder()
        .uri("/health")
        .body(axum::body::Body::empty())
        .expect("valid request");

    let res = app.oneshot(req).await.expect("service ready");

    assert_eq!(res.status(), 200);

    let body = res
        .into_body()
        .collect()
        .await
        .expect("body readable")
        .to_bytes();

    let json: serde_json::Value =
        serde_json::from_slice(&body).expect("valid JSON body");

    assert_eq!(json["status"], "alive");
}
