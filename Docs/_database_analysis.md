# Evidive_MasterDive — Deep Database Analysis (Supabase)

**Source:** Supabase MCP (`user-supabase`) — `list_tables`, `execute_sql`  
**Date:** 2026-02-20

---

## 1. TABLES (with row counts)

| Table | Rows | RLS |
|-------|------|-----|
| _sqlx_migrations | 1 | ✓ |
| blocked_dates | 3 | ✓ |
| bookings | 0 | ✓ |
| centers | 19 | ✓ |
| coupon_sources | 0 | ✓ |
| coupons | 2 | ✓ |
| holidays | 2 | ✓ |
| locations | 1 | ✓ |
| notifications | 0 | ✓ |
| profiles | 9 | ✓ |
| ref_certifications | 15 | ✓ |
| ref_countries | 17 | ✓ |
| ref_dive_types | 8 | ✓ |
| ref_service_categories | 13 | ✓ |
| refunds | 0 | ✓ |
| reviews | 0 | ✓ |
| service_extras | 1 | ✓ |
| services | 5 | ✓ |
| staff | 3 | ✓ |
| staff_hours | 14 | ✓ |
| t_platform_config | 15 | ✓ |
| tags | 2 | ✓ |
| tli_ce_ta | 0 | ✓ |
| tli_pr_ce | 20 | ✓ |
| transactions | 0 | ✓ |

**Note:** `platform_config` in the spec is implemented as **t_platform_config**. Center–profile membership is **tli_pr_ce** (profile–center link), not “center_members”.

---

## 2. KEY SCHEMAS (column definitions)

### profiles
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | uuid | — | PK, FK → auth.users |
| role | user_role | 'diver' | enum: diver, admin_diver |
| first_name, last_name, display_name | text | — | nullable |
| avatar_url, phone | text | — | nullable |
| preferred_locale | text | 'fr' | |
| created_at, updated_at | timestamptz | now() | |
| deleted_at | timestamptz | — | nullable, soft delete |

### centers
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | uuid | gen_random_uuid() | PK |
| owner_id | uuid | — | FK → profiles |
| name, slug | text | — | slug unique |
| description, address, city, region, country, postal_code | text | nullable | |
| latitude, longitude | numeric(10,8), numeric(11,8) | nullable | |
| email, phone, website, facebook_url, instagram_url | text | nullable | |
| dive_types, languages, certifications, payment_methods | text[] | defaults | |
| eco_commitment | bool | false | |
| opening_hours | jsonb | nullable | |
| logo_url, cover_url, images | text / text[] | nullable | |
| price_from | numeric(10,2) | nullable | |
| currency | text | 'EUR' | |
| stripe_account_id | text | nullable | |
| stripe_onboarding_complete | bool | false | |
| status | center_status | 'pending' | pending, active, suspended, rejected, inactive |
| is_featured | bool | false | |
| created_at, updated_at, deleted_at | timestamptz | now() / nullable | |

### services
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | uuid | gen_random_uuid() | PK |
| center_id | uuid | — | FK → centers |
| name, description, category | text | nullable | |
| duration_minutes | int4 | 60 | |
| max_capacity | int4 | 1 | |
| min_participants | int4 | 1 | |
| price | numeric | — | |
| currency | text | 'EUR' | |
| min_certification | text | nullable | |
| min_dives | int4 | nullable | |
| is_active | bool | true | |
| created_at, updated_at, deleted_at | timestamptz | now() / nullable | |

### bookings
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | uuid | gen_random_uuid() | PK |
| service_id, center_id, client_id | uuid | — | FK → services, centers, profiles |
| booking_date | date | — | |
| time_slot | time | — | |
| participants | int4 | 1 | |
| status | booking_status | 'pending' | pending, confirmed, paid, cancelled, completed, noshow |
| unit_price, total_price | numeric(10,2) | — | |
| commission_rate | numeric(5,2) | 20.00 | |
| commission_amount | numeric(10,2) | — | |
| currency | text | 'EUR' | |
| client_note, center_note | text | nullable | |
| created_at, updated_at | timestamptz | now() | |
| confirmed_at, cancelled_at, completed_at, deleted_at | timestamptz | nullable | |

### reviews
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | uuid | gen_random_uuid() | PK |
| booking_id | uuid | unique | FK → bookings |
| center_id, client_id | uuid | — | FK → centers, profiles |
| rating | int4 | — | CHECK 1–5 |
| comment, reply | text | nullable | |
| replied_at | timestamptz | nullable | |
| is_published | bool | true | |
| created_at, updated_at, deleted_at | timestamptz | now() / nullable | |

### transactions
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | uuid | gen_random_uuid() | PK |
| booking_id | uuid | — | FK → bookings |
| stripe_payment_intent_id, stripe_transfer_id | text | nullable | |
| amount, platform_fee, vendor_amount | numeric(10,2) | — | |
| currency | text | 'EUR' | |
| status | payment_status | 'pending' | pending, processing, succeeded, failed, refunded |
| created_at, updated_at, deleted_at | timestamptz | now() / nullable | |

### refunds
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | uuid | gen_random_uuid() | PK |
| booking_id | uuid | — | FK → bookings |
| amount | numeric(10,2) | — | CHECK > 0 |
| currency | text | 'EUR' | |
| reason | text | nullable | |
| status | text | 'pending' | CHECK: pending, approved, rejected |
| processed_by | uuid | nullable | FK → profiles |
| created_at, updated_at | timestamptz | now() | |

### coupons
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | uuid | gen_random_uuid() | PK |
| code | text | — | unique |
| source_id | uuid | nullable | FK → coupon_sources |
| center_id, user_id | uuid | nullable | FK → centers, profiles |
| discount_type | text | — | CHECK: percent, fixed |
| discount_value | numeric(10,2) | — | CHECK > 0 |
| currency | text | 'EUR' | |
| min_amount | numeric(10,2) | nullable | |
| max_uses, used_count | int4 | 1, 0 | |
| is_active | bool | true | |
| expires_at | timestamptz | nullable | |
| created_at, updated_at | timestamptz | now() | |

### coupon_sources
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | uuid | gen_random_uuid() | PK |
| slug | text | — | unique |
| label | text | — | |
| discount_type | text | — | percent, fixed |
| discount_value | numeric(10,2) | — | CHECK > 0 |
| currency | text | 'EUR' | |
| max_claims | int4 | nullable | |
| claims_count | int4 | 0 | |
| is_active | bool | true | |
| expires_at | timestamptz | nullable | |
| created_at, updated_at | timestamptz | now() | |

### service_extras
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | uuid | gen_random_uuid() | PK |
| name, description | text | nullable | |
| price | numeric(10,2) | 0 | |
| currency | text | 'EUR' | |
| is_active | bool | true | |
| created_at, updated_at, deleted_at | timestamptz | now() / nullable | |

**Note:** No FK from service_extras to services or centers — extras are global (admin-managed).

### staff
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | uuid | gen_random_uuid() | PK |
| center_id | uuid | — | FK → centers |
| profile_id | uuid | nullable | FK → profiles |
| first_name, last_name, email, phone | text | nullable | |
| role_label | text | 'instructor' | |
| bio, avatar_url | text | nullable | |
| is_active | bool | true | |
| created_at, updated_at, deleted_at | timestamptz | now() / nullable | |

### tli_pr_ce (center membership / “center_members”)
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | uuid | gen_random_uuid() | PK |
| fk_profile | uuid | — | FK → profiles |
| fk_center | uuid | — | FK → centers |
| role_in_center | text | 'owner' | CHECK: **owner, staff, employee, manager** (no 'admin') |
| created_at | timestamptz | now() | |
| UNIQUE(fk_profile, fk_center) | | | |

### blocked_dates
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | uuid | gen_random_uuid() | PK |
| center_id | uuid | — | FK → centers |
| blocked_date | date | — | |
| reason | text | nullable | |
| created_at | timestamptz | now() | |
| UNIQUE(center_id, blocked_date) | | | |

### holidays
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | uuid | gen_random_uuid() | PK |
| center_id | uuid | — | FK → centers |
| staff_id | uuid | nullable | FK → staff |
| title | text | — | |
| start_date, end_date | date | — | |
| created_at | timestamptz | now() | |

### t_platform_config (platform_config)
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| key | text | — | PK |
| value | text | '' | |
| category | text | — | CHECK: stripe, smtp, google, platform |
| is_secret | bool | false | |
| description | text | nullable | |
| updated_at | timestamptz | now() | |
| updated_by | uuid | nullable | FK → profiles |

### notifications
| Column | Type | Default | Notes |
|--------|------|---------|-------|
| id | uuid | gen_random_uuid() | PK |
| user_id | uuid | — | FK → profiles |
| title, body | text | — | |
| link | text | nullable | |
| is_read | bool | false | |
| created_at | timestamptz | now() | |

---

## 3. RLS POLICIES (summary)

All 24 public tables have RLS enabled. Policies by table:

- **blocked_dates:** SELECT/INSERT/UPDATE/DELETE for center members with role owner **or admin** (see ISSUES).
- **bookings:** INSERT as client; SELECT own or center member; UPDATE for center members. No DELETE policy.
- **centers:** INSERT (owner_id = uid); SELECT anon (active only), auth (active or own or member); UPDATE owner or owner-role in tli_pr_ce.
- **coupon_sources:** CRUD admin_diver; SELECT public when active or admin.
- **coupons:** CRUD admin_diver; SELECT own or admin.
- **holidays:** CRUD for center owner/admin; SELECT for center member.
- **locations:** CRUD admin_diver; SELECT public.
- **notifications:** SELECT/UPDATE own only; no INSERT (likely server/trigger).
- **profiles:** SELECT own or admin_diver; UPDATE own. **No INSERT** (relies on trigger or backend).
- **ref_***:** SELECT public.
- **refunds:** CRUD admin_diver only.
- **reviews:** INSERT client with completed booking; UPDATE center member (reply); SELECT public when is_published.
- **service_extras:** CRUD admin_diver; SELECT public.
- **services:** SELECT anon (active + center active), auth (same or center member); INSERT/UPDATE/DELETE center member.
- **staff:** SELECT center member; INSERT/UPDATE/DELETE center owner/admin.
- **staff_hours:** SELECT center member; INSERT/UPDATE/DELETE center owner/admin.
- **t_platform_config:** ALL for admin_diver only.
- **tags:** CRUD admin_diver; SELECT public.
- **tli_ce_ta:** SELECT public; INSERT/DELETE center owner/admin.
- **tli_pr_ce:** SELECT own or admin_diver; no INSERT/UPDATE/DELETE (handled by backend or migration).
- **transactions:** SELECT via booking (client or center member).

---

## 4. INDEXES (non-primary)

| Table | Index | Type |
|-------|--------|------|
| blocked_dates | blocked_dates_center_id_blocked_date_key | UNIQUE(center_id, blocked_date) |
| blocked_dates | idx_blocked_dates_center_id | btree(center_id) |
| bookings | idx_bookings_center, idx_bookings_client, idx_bookings_date | btree |
| bookings | idx_bookings_deleted_at | partial WHERE deleted_at IS NULL |
| bookings | idx_bookings_service, idx_bookings_status | btree |
| centers | centers_slug_key | UNIQUE(slug) |
| centers | idx_centers_country, idx_centers_owner, idx_centers_slug, idx_centers_status | btree |
| centers | idx_centers_deleted_at | partial WHERE deleted_at IS NULL |
| coupon_sources | coupon_sources_slug_key | UNIQUE(slug) |
| coupons | coupons_code_key | UNIQUE(code) |
| coupons | idx_coupons_center_id, idx_coupons_code, idx_coupons_source_id, idx_coupons_user_id | btree |
| holidays | idx_holidays_center_id, idx_holidays_staff_id | btree |
| locations | idx_locations_country | partial WHERE deleted_at IS NULL |
| notifications | idx_notifications_user_id, idx_notifications_unread | btree, partial WHERE is_read = false |
| profiles | idx_profiles_deleted_at, idx_profiles_role | btree, partial |
| refunds | idx_refunds_booking_id, idx_refunds_processed_by | btree |
| refunds | idx_refunds_status | partial WHERE status = 'pending' |
| reviews | reviews_booking_id_key | UNIQUE(booking_id) |
| reviews | idx_reviews_center, idx_reviews_client, idx_reviews_rating | btree |
| reviews | idx_reviews_deleted_at | partial |
| services | idx_services_active, idx_services_category, idx_services_center | btree |
| services | idx_services_deleted_at | partial |
| staff | idx_staff_center_id, idx_staff_profile_id | partial WHERE deleted_at IS NULL |
| staff_hours | staff_hours_staff_id_day_of_week_key | UNIQUE(staff_id, day_of_week) |
| staff_hours | idx_staff_hours_staff_id | btree |
| t_platform_config | idx_platform_config_updated_by | partial WHERE updated_by IS NOT NULL |
| tags | tags_name_key | UNIQUE(name) |
| tli_ce_ta | idx_tli_ce_ta_center, idx_tli_ce_ta_tag | btree |
| tli_pr_ce | tli_pr_ce_fk_profile_fk_center_key | UNIQUE(fk_profile, fk_center) |
| tli_pr_ce | idx_tli_pr_ce_center, idx_tli_pr_ce_profile | btree |
| transactions | idx_transactions_booking, idx_transactions_status | btree |
| transactions | idx_transactions_active | partial WHERE deleted_at IS NULL |

---

## 5. TRIGGERS

| Table | Trigger | Event | Function |
|-------|---------|-------|----------|
| bookings | set_bookings_updated_at | UPDATE | update_updated_at() |
| bookings | trg_set_updated_at | UPDATE | set_updated_at() |
| bookings | calculate_commission_before_insert | INSERT, UPDATE | calculate_booking_commission() |
| centers | set_centers_updated_at, trg_set_updated_at | UPDATE | update_updated_at(), set_updated_at() |
| profiles | set_profiles_updated_at, trg_set_updated_at | UPDATE | update_updated_at(), set_updated_at() |
| reviews | set_reviews_updated_at, trg_set_updated_at | UPDATE | update_updated_at(), set_updated_at() |
| services | set_services_updated_at, trg_set_updated_at | UPDATE | update_updated_at(), set_updated_at() |
| t_platform_config | set_platform_config_updated_at | UPDATE | update_updated_at() |
| transactions | set_transactions_updated_at, trg_set_updated_at | UPDATE | update_updated_at(), set_updated_at() |

**Functions:**
- `set_updated_at()`, `update_updated_at()`: both set `NEW.updated_at = now()` (duplicate behavior).
- `calculate_booking_commission()`: `NEW.commission_amount := NEW.total_price * (NEW.commission_rate / 100)`.

---

## 6. FOREIGN KEYS

| From | Column | To |
|------|--------|-----|
| profiles | id | auth.users.id |
| centers | owner_id | profiles.id |
| services | center_id | centers.id |
| bookings | service_id, center_id, client_id | services.id, centers.id, profiles.id |
| transactions | booking_id | bookings.id |
| reviews | booking_id, center_id, client_id | bookings.id, centers.id, profiles.id |
| refunds | booking_id, processed_by | bookings.id, profiles.id |
| coupons | source_id, center_id, user_id | coupon_sources.id, centers.id, profiles.id |
| staff | center_id, profile_id | centers.id, profiles.id |
| staff_hours | staff_id | staff.id |
| holidays | center_id, staff_id | centers.id, staff.id |
| blocked_dates | center_id | centers.id |
| notifications | user_id | profiles.id |
| t_platform_config | updated_by | profiles.id |
| tli_pr_ce | fk_profile, fk_center | profiles.id, centers.id |
| tli_ce_ta | fk_center, fk_tag | centers.id, tags.id |

**service_extras** and **locations** have no FKs to centers/services.

---

## 7. ENUMS (application-relevant)

| Enum | Values |
|------|--------|
| user_role | diver, admin_diver |
| center_status | pending, active, suspended, rejected, inactive |
| booking_status | pending, confirmed, paid, cancelled, completed, noshow |
| payment_status | pending, processing, succeeded, failed, refunded |

(Other enums in DB are from extensions, e.g. auth.)

---

## 8. DECIMAL COLUMNS (numeric — Rust `Decimal` mapping)

| Table | Column | Precision | Scale |
|-------|--------|-----------|-------|
| bookings | unit_price, total_price, commission_rate, commission_amount | 10/5 | 2 |
| centers | latitude, longitude, price_from | 10/11 | 8/2 |
| coupon_sources | discount_value | 10 | 2 |
| coupons | discount_value, min_amount | 10 | 2 |
| locations | latitude, longitude | 10 | 7 |
| refunds | amount | 10 | 2 |
| service_extras | price | 10 | 2 |
| services | price | 10 | 2 |
| transactions | amount, platform_fee, vendor_amount | 10 | 2 |

---

## 9. ISSUES

### P0 — Critical

- **tli_pr_ce role vs RLS:** Table `tli_pr_ce` has CHECK `role_in_center IN ('owner','staff','employee','manager')`. There is **no 'admin'** value. Multiple RLS policies (blocked_dates, holidays, staff, staff_hours, tli_ce_ta) allow INSERT/UPDATE/DELETE when `role_in_center = ANY (ARRAY['owner','admin'])`. Because no row can have `role_in_center = 'admin'`, **center “admin” permissions never apply**. Either add `'admin'` to the CHECK and use it when assigning center roles, or change RLS to use a different role (e.g. `manager`) and align app/backend.

### P1 — Important

- **profiles INSERT:** No RLS INSERT policy on `profiles`. If Supabase Auth sign-up is used and profiles are created via client, inserts will be denied unless a trigger on `auth.users` or a service role creates the profile. Confirm how profile rows are created and add an INSERT policy or document the trigger/service flow.
- **Duplicate updated_at triggers:** Several tables have both `trg_set_updated_at` (set_updated_at) and `set_*_updated_at` (update_updated_at) on UPDATE. Both functions do the same thing. Result is redundant work; consider dropping one set to avoid confusion and double firing.
- **bookings DELETE:** No RLS DELETE policy on `bookings`. Only center members can UPDATE. If soft delete is intended (deleted_at), UPDATE is enough; if hard delete is ever needed, add an explicit DELETE policy.

### P2 — Improvements

- **service_extras:** No link to services or centers; extras are global. If the product needs per-service or per-center extras, add a junction or FKs and migrations.
- **_sqlx_migrations RLS:** Migration table has RLS enabled. Typically only service role or migrations run against it; ensure migration runner uses a role that can read/write, or consider disabling RLS for this table if safe for your deployment.
- **refunds.status:** Uses freeform text + CHECK instead of an enum (unlike booking_status, payment_status). Consider a refund_status enum for consistency and type safety.
- **notifications INSERT:** No RLS INSERT; inserts are likely from backend or Edge Function. Document and ensure only trusted code can insert.

---

**INTENT:** Deep analysis of Evidive_MasterDive Supabase schema for documentation and issue tracking.  
**PROOF:** All sections derived from MCP `list_tables` and `execute_sql` results.  
**RESULT:** PASS — analysis complete; P0/P1/P2 issues recorded above.
