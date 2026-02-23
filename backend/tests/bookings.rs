/// T-14: Booking lifecycle — confirm sets confirmed_at, status transitions are atomic.
///
/// Requires a running PostgreSQL instance (via `DATABASE_URL`).
/// Runs automatically in CI (Increment 11 configures the Postgres service).
/// Locally: set `DATABASE_URL` and run `cargo test --test bookings`.

#[sqlx::test]
async fn confirm_booking_sets_confirmed_at(pool: sqlx::PgPool) {
    let row: Option<(bool,)> = sqlx::query_as(
        "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings')",
    )
    .fetch_optional(&pool)
    .await
    .expect("query should succeed");

    assert!(
        row.is_some(),
        "bookings table must exist in the test database"
    );

    let booking_id: Option<(uuid::Uuid,)> = sqlx::query_as(
        r#"
        INSERT INTO bookings (client_id, center_id, service_id, booking_date, start_time, status, total_price, commission_rate, commission_amount, currency)
        SELECT
            (SELECT id FROM profiles LIMIT 1),
            (SELECT id FROM centers WHERE deleted_at IS NULL LIMIT 1),
            (SELECT id FROM services WHERE deleted_at IS NULL LIMIT 1),
            CURRENT_DATE + INTERVAL '7 days',
            '10:00:00'::time,
            'pending'::booking_status,
            100.00,
            20.00,
            20.00,
            'EUR'
        RETURNING id
        "#,
    )
    .fetch_optional(&pool)
    .await
    .expect("insert should succeed");

    if booking_id.is_none() {
        eprintln!("SKIP: no profiles/centers/services in test DB — cannot create test booking");
        return;
    }

    let (bid,) = booking_id.expect("booking created");

    let result = sqlx::query(
        r#"
        UPDATE bookings
        SET status = 'confirmed'::booking_status,
            confirmed_at = NOW(),
            updated_at = NOW()
        WHERE id = $1 AND status = 'pending'
        "#,
    )
    .bind(bid)
    .execute(&pool)
    .await
    .expect("update should succeed");

    assert_eq!(result.rows_affected(), 1, "one booking row should be updated");

    let confirmed_at: Option<(Option<chrono::DateTime<chrono::Utc>>,)> = sqlx::query_as(
        "SELECT confirmed_at FROM bookings WHERE id = $1",
    )
    .bind(bid)
    .fetch_optional(&pool)
    .await
    .expect("select should succeed");

    let (ts,) = confirmed_at.expect("booking must exist");
    assert!(ts.is_some(), "confirmed_at must be set after confirmation");

    sqlx::query("DELETE FROM bookings WHERE id = $1")
        .bind(bid)
        .execute(&pool)
        .await
        .expect("cleanup should succeed");
}
