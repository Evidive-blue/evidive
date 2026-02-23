use std::sync::Arc;

use axum::body::Body;
use axum::Router;
use http::Request;
use http_body_util::BodyExt;
use tower::ServiceExt;

use evidive_api::config::Config;
use evidive_api::AppState;

/// Build a test-only `AppState` with a known webhook secret.
/// The DB pool is lazy (never connects), mailer targets localhost,
/// and Stripe uses a test key. Sufficient for extractor-level tests.
fn test_state() -> Arc<AppState> {
    let config = Config {
        port: 0,
        database_url: "postgres://test:test@127.0.0.1:15432/testdb".to_owned(),
        supabase_url: "https://test-project.supabase.co".to_owned(),
        supabase_publishable_key: "eyJ-test-key".to_owned(),
        cors_origin: "http://localhost:3000".to_owned(),
        stripe_secret_key: "sk_test_ci_000".to_owned(),
        stripe_webhook_secret: "whsec_test_secret".to_owned(),
        smtp_host: Some("127.0.0.1".to_owned()),
        smtp_port: 25,
        smtp_user: Some("test".to_owned()),
        smtp_pass: Some("test".to_owned()),
        smtp_from: Some("test@test.local".to_owned()),
    };

    let pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(1)
        .connect_lazy(&config.database_url)
        .expect("lazy pool creation should not fail");

    // SAFETY: smtp_host is Some — set above for test fixture
    let smtp_host = config.smtp_host.as_deref().unwrap();
    let mailer = lettre::AsyncSmtpTransport::<lettre::Tokio1Executor>::builder_dangerous(
        smtp_host,
    )
    .port(config.smtp_port)
    .build();

    let stripe = stripe::Client::new(&config.stripe_secret_key);

    let jwt_decoding_key =
        jsonwebtoken::DecodingKey::from_secret(b"test_jwt_secret");
    let jwt_algorithm = jsonwebtoken::Algorithm::HS256;

    Arc::new(AppState {
        pool,
        config,
        mailer: Some(mailer),
        stripe,
        jwt_decoding_key,
        jwt_algorithm,
        jwt_issuer: "test".to_owned(),
    })
}

/// T-15 / AC-13: missing `Stripe-Signature` header produces HTTP 400.
///
/// This exercises the `StripeEvent` extractor's first guard: if the header
/// is absent, the handler never runs and no DB access occurs.
#[tokio::test]
async fn webhook_missing_signature_returns_400() {
    let state = test_state();

    let app: Router = evidive_api::routes::webhook::router().with_state(state);

    let req = Request::builder()
        .method("POST")
        .uri("/webhook")
        .header("Content-Type", "application/json")
        .body(Body::from(r#"{"type":"checkout.session.completed"}"#))
        .expect("valid request");

    let res = app.oneshot(req).await.expect("service ready");

    assert_eq!(
        res.status().as_u16(),
        400,
        "Missing Stripe-Signature header must produce 400"
    );

    let body = res
        .into_body()
        .collect()
        .await
        .expect("body readable")
        .to_bytes();

    let json: serde_json::Value =
        serde_json::from_slice(&body).expect("valid JSON body");

    assert!(
        json.get("error").is_some(),
        "Response should contain an error field"
    );
}

/// T-03 / AC-3: invalid (tampered) `Stripe-Signature` header produces HTTP 400.
///
/// Even with a well-formed header value, signature verification rejects
/// it and the handler never runs.
#[tokio::test]
async fn webhook_invalid_signature_returns_400() {
    let state = test_state();

    let app: Router = evidive_api::routes::webhook::router().with_state(state);

    let req = Request::builder()
        .method("POST")
        .uri("/webhook")
        .header("Content-Type", "application/json")
        .header("Stripe-Signature", "t=1234567890,v1=badhash")
        .body(Body::from(r#"{"type":"checkout.session.completed"}"#))
        .expect("valid request");

    let res = app.oneshot(req).await.expect("service ready");

    assert_eq!(
        res.status().as_u16(),
        400,
        "Invalid Stripe-Signature must produce 400"
    );
}
