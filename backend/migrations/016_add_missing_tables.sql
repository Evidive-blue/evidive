-- Migration 016: Add missing tables for full platform functionality.
-- Tables: staff, staff_hours, holidays, blocked_dates, notifications,
--         coupons, coupon_sources, coupon_claims, tags, tli_center_tags,
--         locations, service_extras, refunds.

BEGIN;

-- ──────────────────────── Staff ────────────────────────

CREATE TABLE IF NOT EXISTS staff (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id   UUID NOT NULL REFERENCES centers(id),
    profile_id  UUID REFERENCES profiles(id),
    first_name  TEXT NOT NULL,
    last_name   TEXT NOT NULL,
    email       TEXT,
    phone       TEXT,
    role_label  TEXT NOT NULL DEFAULT 'instructor',
    bio         TEXT,
    avatar_url  TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_staff_center_id ON staff(center_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_staff_profile_id ON staff(profile_id) WHERE deleted_at IS NULL;

-- ──────────────────────── Staff Hours ────────────────────────

CREATE TABLE IF NOT EXISTS staff_hours (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id    UUID NOT NULL REFERENCES staff(id),
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time  TIME NOT NULL,
    end_time    TIME NOT NULL,
    UNIQUE (staff_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_staff_hours_staff_id ON staff_hours(staff_id);

-- ──────────────────────── Holidays ────────────────────────

CREATE TABLE IF NOT EXISTS holidays (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id   UUID NOT NULL REFERENCES centers(id),
    staff_id    UUID REFERENCES staff(id),
    title       TEXT NOT NULL,
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_holidays_center_id ON holidays(center_id);
CREATE INDEX IF NOT EXISTS idx_holidays_staff_id ON holidays(staff_id);

-- ──────────────────────── Blocked Dates ────────────────────────

CREATE TABLE IF NOT EXISTS blocked_dates (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id   UUID NOT NULL REFERENCES centers(id),
    blocked_date DATE NOT NULL,
    reason      TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (center_id, blocked_date)
);

CREATE INDEX IF NOT EXISTS idx_blocked_dates_center_id ON blocked_dates(center_id);

-- ──────────────────────── Notifications ────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES profiles(id),
    title       TEXT NOT NULL,
    body        TEXT NOT NULL,
    link        TEXT,
    is_read     BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE is_read = false;

-- ──────────────────────── Coupon Sources ────────────────────────

CREATE TABLE IF NOT EXISTS coupon_sources (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug        TEXT NOT NULL UNIQUE,
    label       TEXT NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
    discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
    currency    TEXT NOT NULL DEFAULT 'EUR',
    max_claims  INTEGER,
    claims_count INTEGER NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    expires_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────── Coupons ────────────────────────

CREATE TABLE IF NOT EXISTS coupons (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code        TEXT NOT NULL UNIQUE,
    source_id   UUID REFERENCES coupon_sources(id),
    center_id   UUID REFERENCES centers(id),
    user_id     UUID REFERENCES profiles(id),
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
    discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
    currency    TEXT NOT NULL DEFAULT 'EUR',
    min_amount  NUMERIC(10,2),
    max_uses    INTEGER NOT NULL DEFAULT 1,
    used_count  INTEGER NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    expires_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_source_id ON coupons(source_id);
CREATE INDEX IF NOT EXISTS idx_coupons_user_id ON coupons(user_id);

-- ──────────────────────── Tags ────────────────────────

CREATE TABLE IF NOT EXISTS tags (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tli_ce_ta (
    fk_center   UUID NOT NULL REFERENCES centers(id),
    fk_tag      UUID NOT NULL REFERENCES tags(id),
    PRIMARY KEY (fk_center, fk_tag)
);

CREATE INDEX IF NOT EXISTS idx_tli_ce_ta_center ON tli_ce_ta(fk_center);
CREATE INDEX IF NOT EXISTS idx_tli_ce_ta_tag ON tli_ce_ta(fk_tag);

-- ──────────────────────── Locations (dive sites) ────────────────────────

CREATE TABLE IF NOT EXISTS locations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    description TEXT,
    latitude    NUMERIC(10,7),
    longitude   NUMERIC(10,7),
    depth_max   INTEGER,
    difficulty  TEXT,
    country     TEXT,
    region      TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_locations_country ON locations(country) WHERE deleted_at IS NULL;

-- ──────────────────────── Service Extras ────────────────────────

CREATE TABLE IF NOT EXISTS service_extras (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    description TEXT,
    price       NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency    TEXT NOT NULL DEFAULT 'EUR',
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

-- ──────────────────────── Refunds ────────────────────────

CREATE TABLE IF NOT EXISTS refunds (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id  UUID NOT NULL REFERENCES bookings(id),
    amount      NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    currency    TEXT NOT NULL DEFAULT 'EUR',
    reason      TEXT,
    status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    processed_by UUID REFERENCES profiles(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refunds_booking_id ON refunds(booking_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status) WHERE status = 'pending';

COMMIT;
