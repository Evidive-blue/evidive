# Evidive MasterDive — Deep Analysis (Frontend + Backend)

**Generated:** Analysis Agent output. All findings marked FACT (with file path) or UNKNOWN.

---

## TARGET

`C:\WhytCard-VisionOfTrust\whytcard-workspace\Clients\Evidive_MasterDive`

---

## STACK

**Frontend** (FACT — `frontend/package.json`):

- Next.js 16.1.6, React 19.2.3, TypeScript 5.9.3
- Tailwind CSS v4 (@tailwindcss/postcss ^4), next-intl 4.8.2
- Supabase JS 2.95.3, Framer Motion 12.34, radix-ui 1.4.3, Zustand 5.0.11
- React Hook Form 7.71.1, Zod 4.3.6
- MapLibre GL 5.18, MapBox GL 3.18, react-map-gl 8.1.0
- Vitest 4.0.18

**Backend** (FACT — `backend/Cargo.toml`):

- Rust edition 2021, rust-version 1.93
- Axum 0.8, Tokio 1, tower-http 0.6 (cors, trace, compression-gzip)
- SQLx 0.8 (PostgreSQL, uuid, chrono, migrate, json, rust_decimal)
- async-stripe 0.31 (checkout, billing, connect, webhook-events)
- lettre 0.11 (SMTP), jsonwebtoken 9, argon2 0.5
- tower_governor 0.8 (rate limiting), vercel_runtime 2 (axum)

**Database:** Supabase PostgreSQL (session pooler port 5432; transaction pooler 6543 avoided — FACT `backend/src/lib.rs`).

**Auth:** Supabase Auth (frontend SDK); backend validates JWT via JWKS from `{SUPABASE_URL}/auth/v1/.well-known/jwks.json` (FACT `backend/src/lib.rs`, `backend/src/middleware/auth.rs`).

**Deployment:** Vercel for frontend and backend (backend as serverless via `api/handler.rs` and `vercel.json` rewrites — FACT `backend/vercel.json`, `backend/api/handler.rs`).

**Domains:** api.evidive.blue (API), evidive.whytcard.ai (frontend) — frontend `site-config.ts` uses `NEXT_PUBLIC_API_URL` with production fallback to `https://api.evidive.blue` and base URL from `NEXT_PUBLIC_BASE_URL` (FACT `frontend/src/lib/site-config.ts`).

---

## ENTRY POINTS

| Layer                       | File                                                                                                        |
| --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Backend (local dev)         | `backend/src/main.rs`                                                                                       |
| Backend (Vercel serverless) | `backend/api/handler.rs`                                                                                    |
| Frontend                    | `frontend/src/app/layout.tsx`, `frontend/src/app/[locale]/layout.tsx`, `frontend/src/app/[locale]/page.tsx` |
| API client                  | `frontend/src/lib/api.ts` (API_BASE = getApiUrl() + `/api/v1`)                                              |

---

## KEY FILES READ

**Backend:**  
`backend/src/main.rs`, `backend/src/lib.rs`, `backend/src/config.rs`, `backend/src/error.rs`, `backend/src/middleware/mod.rs`, `backend/src/middleware/auth.rs`, `backend/src/models/mod.rs`, `backend/src/models/center.rs`, `backend/src/models/profile.rs`, `backend/src/models/service.rs`, `backend/src/models/reference.rs`, `backend/src/models/platform_config.rs`, `backend/src/routes/mod.rs`, `backend/src/routes/health.rs`, `backend/src/routes/centers.rs`, `backend/src/routes/bookings.rs`, `backend/src/routes/services.rs`, `backend/src/routes/profile.rs`, `backend/src/routes/reviews.rs`, `backend/src/routes/admin.rs`, `backend/src/routes/admin_settings.rs`, `backend/src/routes/admin_advanced.rs`, `backend/src/routes/staff.rs`, `backend/src/routes/members.rs`, `backend/src/routes/payments.rs`, `backend/src/routes/stripe_connect.rs`, `backend/src/routes/webhook.rs`, `backend/src/routes/coupons.rs`, `backend/src/routes/dashboard.rs`, `backend/src/routes/reference.rs`, `backend/src/services/mod.rs`, `backend/src/services/stripe.rs`, `backend/src/services/email.rs`, `backend/api/handler.rs`, `backend/migrations/016_add_missing_tables.sql`, `backend/Schema.md`, `backend/errors.md`, `backend/Dockerfile`, `backend/vercel.json`, `backend/Cargo.toml`.

**Frontend:**  
`frontend/src/lib/api.ts` (partial), `frontend/src/lib/site-config.ts`, `frontend/src/app/[locale]/layout.tsx`, `frontend/package.json`, `frontend/vitest.config.ts` (not read; path confirmed).

**Tests / config:**  
`test_api_functional.py`, `analyze_schema_usage.py` (grep only).

---

## DEPENDENCIES

**Internal:**

- None (Evidive_MasterDive is a standalone client project under `whytcard-workspace/Clients/`). No workspace refs to Ecosystem or other packages in the listed files.

**External (backend):**  
axum 0.8, tokio 1, tower/tower-http, sqlx 0.8, serde/serde_json, jsonwebtoken 9, argon2 0.5, async-stripe 0.31, lettre 0.11, tracing, reqwest 0.12, tower_governor 0.8, vercel_runtime 2, dotenvy 0.15, uuid 1, chrono 0.4, rust_decimal 1, thiserror 2, anyhow 1.

**External (frontend):**  
next 16.1.6, react 19.2.3, @supabase/supabase-js 2.95.3, next-intl 4.8.2, framer-motion 12.34, radix-ui 1.4.3, zustand 5.0.11, react-hook-form 7.71.1, zod 4.3.6, maplibre-gl 5.18, mapbox-gl 3.18, tailwindcss 4, vitest 4.0.18.

---

## API ROUTES — BACKEND (all under `/api/v1`)

FACT: `backend/src/routes/mod.rs` composes: `nest("/centers", centers)`, `nest("/profile", profile)`, `nest("/admin", admin)`, `merge(reference)`, `merge(services)`, `merge(bookings)`, `merge(reviews)`, `merge(dashboard)`, `merge(staff)`, `merge(members)`, `merge(coupons)`, `merge(stripe_connect)`, `merge(payments)`, `nest("/stripe", webhook)`.

| Path                                                                                                       | Methods                       | Auth                      | Source                                         |
| ---------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------- | ---------------------------------------------- |
| `/health`, `/health/ready`                                                                                 | GET                           | No                        | lib.rs (root), health.rs                       |
| `/centers`                                                                                                 | GET, POST                     | List public / Create auth | centers.rs                                     |
| `/centers/id/{id}`, `/centers/id/{id}/services`                                                            | GET                           | No                        | centers.rs                                     |
| `/centers/{slug}`                                                                                          | GET, PATCH                    | Public / Member           | centers.rs                                     |
| `/centers/geo`                                                                                             | GET                           | No                        | centers.rs                                     |
| `/centers/{slug}/services`                                                                                 | GET, POST                     | Public / Member           | services.rs                                    |
| `/centers/{slug}/services/{service_id}`                                                                    | PATCH, DELETE                 | Member                    | services.rs                                    |
| `/centers/{slug}/bookings`, `.../reviews`, `.../reviews/{id}/reply`                                        | GET, POST                     | Member                    | services.rs                                    |
| `/profile/me`                                                                                              | GET, PATCH                    | Auth                      | profile.rs                                     |
| `/profile/centers`                                                                                         | GET                           | Auth                      | profile.rs                                     |
| `/reference/countries`, `/dive-types`, `/service-categories`, `/certifications`                            | GET                           | No                        | reference.rs                                   |
| `/bookings`                                                                                                | GET, POST                     | Auth                      | bookings.rs                                    |
| `/bookings/availability`                                                                                   | GET                           | No                        | bookings.rs                                    |
| `/bookings/{id}`, `.../cancel`, `.../confirm`, `.../checkout`                                              | GET, POST                     | Auth / Member             | bookings.rs                                    |
| `/reviews/center/{center_id}`, `/reviews/eligible/{center_id}`, `/reviews/reviewable-bookings/{center_id}` | GET                           | No / Auth / Member        | reviews.rs                                     |
| `/reviews`                                                                                                 | POST                          | Auth                      | reviews.rs                                     |
| `/centers/{slug}/kpis`, `.../calendar`, `.../blocked-dates`, `.../holidays`                                | GET, POST, DELETE             | Member                    | dashboard.rs                                   |
| `/centers/{slug}/staff`, `.../staff/{id}`, `.../staff/{id}/bio`, `.../staff/{id}/hours`                    | GET, POST, PATCH, PUT, DELETE | Member                    | staff.rs                                       |
| `/centers/{slug}/members`, `.../members/{id}`                                                              | GET, POST, PATCH, DELETE      | Member / Owner            | members.rs                                     |
| `/commissions`, `/payments`, `/revenue`                                                                    | GET                           | Member                    | payments.rs                                    |
| `/payouts/request`                                                                                         | POST                          | Owner                     | payments.rs                                    |
| `/stripe/connect`                                                                                          | POST                          | Owner                     | stripe_connect.rs                              |
| `/stripe/config`                                                                                           | GET, PATCH                    | Auth                      | stripe_connect.rs                              |
| `/stripe/webhook`                                                                                          | POST                          | Stripe signature          | webhook.rs                                     |
| `/coupons/sources`, `/coupons/mine`, `/coupons/validate`, `/coupons/claim/{slug}`                          | GET, POST                     | Public/Auth               | coupons.rs                                     |
| `/admin/*` (stats, centers, users, bookings, reviews, settings, advanced)                                  | Various                       | admin_diver               | admin.rs, admin_settings.rs, admin_advanced.rs |

---

## API ROUTES — FRONTEND CALLS VS BACKEND

**FACT:** Frontend uses `getApiUrl() + "/api/v1"` and relative paths (e.g. `/profile/me`, `/centers`, `/bookings`) — `frontend/src/lib/api.ts`.

- **Center-level finance:** Frontend calls `GET /commissions?center_id=`, `GET /payments?center_id=`, `GET /revenue?center_id=`, `POST /payouts/request`, `GET /stripe/config`, `POST /stripe/connect`. Backend implements all of these (payments.rs, stripe_connect.rs). **Match.**
- **Coupons:** Frontend calls `GET /coupons/validate?...`, `GET /coupons/mine`, `GET /coupons/sources`, `POST /coupons/claim/{slug}`. Backend implements all (coupons.rs). **Match.**
- **test_api_functional.py Phase 7 (“ghost endpoints”):** The test calls the same paths with **GET** for all; backend expects **POST** for `/payouts/request` and `/stripe/connect`. So Phase 7 can yield 405 for those two; the routes themselves exist (FACT backend payments.rs, stripe_connect.rs).
- **Checkout:** Backend has `POST /bookings/{booking_id}/checkout` (bookings.rs). No `checkout` reference in frontend `src` (grep). **Backend implemented; frontend not yet calling.**

---

## DATA FLOW

1. **Supabase Auth → JWT → Backend → PostgreSQL**
   - Frontend: Supabase Auth (signInWithPassword, signUp, session); token from `getSupabaseToken()` sent as `Authorization: Bearer <token>` (FACT `frontend/src/lib/api.ts`).
   - Backend: JWKS fetched at startup from `Config::jwks_url()`; `AuthUser` extractor validates JWT (ES256/RS256, audience `authenticated`, issuer `{SUPABASE_URL}/auth/v1`). Queries use `profiles` and `tli_pr_ce`; admin check via `profiles.role = 'admin_diver'` (FACT `backend/src/middleware/auth.rs`, `backend/src/lib.rs`).

2. **Stripe Connect**
   - Center onboarding: `POST /stripe/connect` creates or reuses Stripe Account, returns AccountLink URL (stripe_connect.rs).
   - Webhook `account.updated` sets `centers.stripe_onboarding_complete` from `charges_enabled` (webhook.rs).
   - Checkout: `POST /bookings/{id}/checkout` creates Stripe Checkout Session; if center has Connect account, uses transfer_data and application_fee_amount (bookings.rs).
   - Webhooks: `checkout.session.completed` → insert `transactions`; `payment_intent.succeeded` → set booking to confirmed; `charge.refunded` → transaction status refunded (webhook.rs).

3. **Email**
   - Mailer built in `create_app` from Config (SMTP); stored in `AppState.mailer` (lib.rs, services/email.rs). No handler in the read route files sends email; mailer is available for future use (FACT services/email.rs, lib.rs).

---

## CURRENT STATE

### Working (FACT)

- Health: `GET /health`, `GET /health/ready` (health.rs).
- Public centers: list, by slug, by id, services by id, geo (centers.rs).
- Profile: get/update me, my centers (profile.rs).
- Reference: countries, dive-types, service-categories, certifications (reference.rs).
- Centers CRUD: create (auth), update by slug (member) (centers.rs).
- Services: list by slug/id, create/update/delete (member); center bookings/reviews/reply (services.rs).
- Bookings: create, list mine, get/cancel/confirm/checkout, availability (bookings.rs).
- Reviews: public by center, eligible, reviewable-bookings, create, center list + reply (reviews.rs).
- Dashboard: KPIs, calendar, blocked-dates, holidays (dashboard.rs).
- Staff: CRUD, bio, hours (staff.rs).
- Members: list, add, update role, remove (members.rs).
- Payments (center): commissions, payments, revenue, payouts/request (payments.rs).
- Stripe: connect link, config get/patch (stripe_connect.rs); webhook handler (webhook.rs).
- Coupons: sources, mine, validate, claim (coupons.rs).
- Admin: stats, centers, users, bookings, reviews, settings, admin_advanced routes (admin\*.rs).
- Auth: Supabase sign-in/sign-up/session; backend JWT validation and role/center checks (auth.rs, api.ts).

### Broken / Missing / Unknown

- **Frontend checkout:** Backend exposes `POST /bookings/{id}/checkout`; frontend does not call it (grep in `frontend/src`). **FACT:** missing frontend integration.
- **Profile response shape:** Test script expects profile to include `email`, `username`, `status`, `admin`, `email_verified`, `diver_profile`; backend Profile model has `id, role, first_name, last_name, display_name, avatar_url, phone, preferred_locale, created_at, updated_at` (profile.rs). **FACT:** frontend may expect extra fields that backend does not return (test_api_functional.py Phase 8).
- **Email sending:** Mailer is built and injected but no route in the read files sends email. **UNKNOWN** whether any other module or future route uses it.
- **RLS:** Supabase linter reports RLS disabled on many public tables (errors.md). Access control is enforced in the Rust API; direct PostgREST access to those tables would not be restricted. **FACT** from errors.md.
- **Bookings `service_id` NOT NULL:** Schema and bookings.rs use `service_id`; migration 016 not fully read. **FACT** from Schema.md and bookings insert.

---

## MONOREPO IMPACT

- **None** for the Evidive_MasterDive project itself: it lives under `whytcard-workspace/Clients/Evidive_MasterDive` and does not reference sibling packages or Ecosystem in the analyzed files.
- If shared packages (e.g. from Ecosystem) are later used by Evidive, that would create impact; not observed in current entry points and api/site-config.

---

## RISKS IDENTIFIED

1. **API base URL:** Production frontend fallback is `https://api.evidive.blue` in site-config. If env `NEXT_PUBLIC_API_URL` is unset in production, the hardcoded fallback is used (FACT site-config.ts).
2. **Rate limiting:** Enabled only in non-debug builds (main.rs); Vercel serverless has no per-process governor. Relies on Vercel/edge for abuse control (FACT main.rs).
3. **JWKS at startup:** Backend fails to start if JWKS fetch fails (create_app). Supabase outage or URL misconfiguration prevents deploy (FACT lib.rs).
4. **Stripe webhook:** Mounted at `POST /api/v1/stripe/webhook`; Stripe must be configured with that URL and correct secret (FACT webhook.rs, routes/mod.rs).
5. **Members list:** Uses `auth.users` (Supabase schema). Requires DB role with access to `auth.users` (FACT members.rs).
6. **transactions table:** Webhook and payments routes depend on it. Schema.md and migrations define it; payments.rs expects `stripe_payment_intent_id`, `platform_fee`, `vendor_amount`, etc. (FACT webhook.rs, payments.rs).

---

## QUESTIONS FOR USER

1. **Production API URL:** Production uses `https://api.evidive.blue`. Verify `NEXT_PUBLIC_API_URL` is set accordingly in Vercel env vars.
2. **Checkout UX:** Should the frontend add a “Pay” flow that calls `POST /bookings/{id}/checkout` and redirects to the returned Stripe URL?
3. **Profile fields:** Should the backend extend the profile response (or a dedicated “me” endpoint) with `email`, `username`, `status`, `admin`, `email_verified`, `diver_profile` from Supabase/auth, or should the frontend stop relying on these and use only the current Profile shape?

---

## PRODUCTION LIVE TESTING (Browser + API — 2026-02-21)

### Méthode

Analyse réalisée via le navigateur Cursor IDE (Chromium headless) et PowerShell `Invoke-WebRequest`.
URLs testées :

- Frontend : `https://evidive-master-dive.vercel.app`
- API production : `https://api.evidive.blue`
- API Vercel : `https://api.evidive.blue`

---

### 1. Santé de l'API

| Endpoint                  | URL               | Status  | Détail                                      |
| ------------------------- | ----------------- | ------- | ------------------------------------------- |
| Health (api.evidive.blue) | `/health`         | **200** | `{"status":"alive"}`                        |
| Readiness                 | `/health/ready`   | **200** | `{"database":"connected","status":"ready"}` |

**NOTE** : Le fallback production dans `site-config.ts` pointe vers `https://api.evidive.blue`. Vérifier que `NEXT_PUBLIC_API_URL` est correctement configuré dans les variables d'environnement Vercel.

### 2. Endpoints API publics

| Endpoint                                          | Status  | Données                                |
| ------------------------------------------------- | ------- | -------------------------------------- |
| `GET /api/v1/centers`                             | 200     | 16 centres, 4772 bytes                 |
| `GET /api/v1/centers/geo`                         | 200     | 12 points géolocalisés                 |
| `GET /api/v1/centers/poseidon-dive-club`          | 200     | 957 bytes                              |
| `GET /api/v1/centers/poseidon-dive-club/services` | 200     | 11 bytes (vide)                        |
| `GET /api/v1/centers/poseidon-dive-club/reviews`  | **401** | Auth requise pour lire les avis (FACT) |
| `GET /api/v1/reference/countries`                 | 200     | 17 pays                                |
| `GET /api/v1/reference/dive-types`                | 200     | 8 types                                |
| `GET /api/v1/reference/service-categories`        | 200     | 13 catégories                          |
| `GET /api/v1/reference/certifications`            | 200     | 15 certifications                      |

### 3. Endpoints API protégés (sans auth)

| Endpoint                             | Status  | Commentaire                                    |
| ------------------------------------ | ------- | ---------------------------------------------- |
| `GET /api/v1/profile`                | **404** | Route non trouvée sans auth (devrait être 401) |
| `GET /api/v1/admin/stats`            | 401     | Correct                                        |
| `GET /api/v1/bookings`               | 401     | Correct                                        |
| `GET /api/v1/payments`               | 401     | Correct                                        |
| `GET /api/v1/stripe/config`          | 401     | Correct                                        |
| `GET /api/v1/reviews`                | **405** | Method Not Allowed                             |
| `GET /api/v1/coupons`                | **404** | Route non trouvée                              |
| `POST /api/v1/bookings/availability` | **405** | Method Not Allowed                             |

### 4. Données de test en production

**CRITIQUE** — 4 centres de test visibles publiquement sur le site de production :

| Centre                      | Slug                          | Ville            | Visible sur carte           |
| --------------------------- | ----------------------------- | ---------------- | --------------------------- |
| QA Test Diving Center       | `qa-test-diving-center`       | Nice, FR         | Oui (lat: 43.69, lng: 7.27) |
| test                        | `test`                        | lausanne, suisse | Non                         |
| Test Dive Center Playwright | `test-dive-center-playwright` | Marseille, FR    | Non                         |
| TESTARO                     | `testaro`                     | Moudon, CH       | Non                         |

Le centre "QA Test Diving Center" apparaît sur la carte interactive avec son marker.

### 5. Frontend — Routes testées

| Route                         | Status        | Titre                                          | Observations                           |
| ----------------------------- | ------------- | ---------------------------------------------- | -------------------------------------- |
| `/` (home)                    | **200**       | EviDive - Book Your Dive Experiences Worldwide | OK, 0 erreur console                   |
| `/centers`                    | **200**       | Dive Centers                                   | Globe MapLibre charge après ~5s        |
| `/centers/poseidon-dive-club` | **200**       | Poseidon Dive Club — Marseille                 | Description sans accents dans la DB    |
| `/blog`                       | **200**       | Diving Blog                                    | 8 articles, filtres par catégorie      |
| `/about`                      | **200**       | Born from a passion for the depths             | Contenu riche                          |
| `/faq`                        | **200**       | Frequently Asked Questions                     | 20 questions, 4 catégories             |
| `/contact`                    | **200**       | —                                              | Page existe                            |
| `/careers`                    | **200**       | —                                              | Page existe                            |
| `/terms`                      | **200**       | —                                              | Page existe                            |
| `/privacy`                    | **200**       | —                                              | Page existe                            |
| `/login`                      | **200**       | Sign in                                        | Google OAuth **disabled**              |
| `/register`                   | **200**       | Create account                                 | Google OAuth **disabled**              |
| `/dashboard`                  | **302→login** | —                                              | Redirect auth OK                       |
| `/onboard/center`             | **200**       | Register my center                             | Formulaire complet                     |
| `/sitemap`                    | **200**       | —                                              | Page HTML existante                    |
| **`/destinations`**           | **404**       | —                                              | Lien dans footer mais page inexistante |
| **`/offers`**                 | **404**       | —                                              | Lien "Special offers" cassé            |
| **`/explorer`**               | **404**       | —                                              | Listé dans sitemap.xml mais inexistant |

### 6. SEO — Sitemap & Robots

**Sitemap.xml** (FACT — `GET /sitemap.xml` → 200) :

- Domaine utilisé : `evidive.whytcard.ai` (pas `evidive-master-dive.vercel.app` ni `evidive.blue`)
- Route `/explorer` listée mais retourne 404
- Blog et FAQ absents du sitemap
- Pas de sitemap dynamique pour les centres individuels

**robots.txt** (FACT — `GET /robots.txt` → 200) :

```
User-Agent: *
Allow: /
Disallow: /admin
Disallow: /api
Sitemap: https://evidive.whytcard.ai/sitemap.xml
```

- Même domaine incorrect (`evidive.whytcard.ai`)
- Bloque correctement `/admin` et `/api`

### 7. Internationalisation (i18n)

Test FR (`/fr`) : **100% traduit** — tous les labels, headings, footer, navigation, boutons.

| Élément   | EN                                   | FR                                    | Status |
| --------- | ------------------------------------ | ------------------------------------- | ------ |
| Navbar    | Home, Centers, Blog, About           | Accueil, Centres, Blog, À propos      | OK     |
| H1        | Dive in total freedom with EviDive   | Plongez en toute liberté avec EviDive | OK     |
| CTA       | Explore dive sites                   | Explorer les sites de plongée         | OK     |
| Footer    | Discover, Company, Legal             | Découvrir, Entreprise, Légal          | OK     |
| Copyright | © 2026 EviDive. All rights reserved. | © 2026 EviDive. Tous droits réservés. | OK     |
| Credits   | Designed by WhytCard                 | Conçu par WhytCard                    | OK     |

**Faute d'orthographe FR** : "Réservation Simplifiée & **Instantané**" → devrait être "**Instantanée**" (accord féminin).

### 8. Responsive (Mobile 375x812)

- Barre de navigation bottom fonctionnelle (Home, Centers, Blog, About)
- Boutons flottants (effets, assistant plongée, langue, login) accessibles
- Logo EviDive visible dans l'animation océan
- Le fond animé océan occupe tout le viewport initial sur chaque page

### 9. Accessibilité (snapshot DOM)

- Navigation principale avec `role: navigation` et `name: Main navigation` ✓
- Headings hiérarchiques H1 → H2 → H3 ✓
- Boutons avec labels explicites (Change language, Login, Search, Disable effects) ✓
- Formulaires avec labels associés aux inputs ✓
- Liens sociaux avec noms (Instagram, Facebook, LinkedIn) ✓
- FAB "Dive assistant" avec `states: collapsed` ✓

### 10. Performances (observations)

- Page d'accueil : 0 erreur console, 0 erreur réseau
- Tous les assets (JS, CSS, fonts, images) en 200
- RSC prefetching actif (XHR vers `/centers?_rsc=...`, `/blog?_rsc=...`, etc.)
- Chargement des centres : ~5s de spinner avant affichage du globe
- Blog : contenu sous le fold (animation océan en premier)

---

## SYNTHÈSE DES PROBLÈMES EN PRODUCTION

### CRITIQUES

1. **Variables d'environnement Vercel** : Vérifier que `NEXT_PUBLIC_API_URL` est configuré sur `https://api.evidive.blue` dans le projet Vercel frontend.
2. **Google OAuth disabled** : Les boutons "Continue with Google" sont `disabled` sur login et register. Les utilisateurs ne peuvent se connecter que par email/password.
3. **4 centres de test en production** : "QA Test Diving Center", "test", "Test Dive Center Playwright", "TESTARO" sont visibles publiquement. Le premier apparaît même sur la carte.

### WARNINGS

4. **Sitemap/robots.txt domaine incorrect** : Référencent `evidive.whytcard.ai` au lieu du domaine réel. Impact SEO direct.
5. **3 liens cassés dans le footer** : `/destinations`, `/offers` (Special offers), et `/explorer` (dans le sitemap) retournent 404.
6. **Reviews nécessitent une authentification** : `GET /centers/{slug}/reviews` retourne 401, empêchant l'affichage public des avis.
7. **Profile retourne 404 au lieu de 401** : Sans auth, la route profile n'est pas trouvée au lieu de renvoyer Unauthorized.
8. **Données sans accents** : Description du Poseidon Dive Club : "Plongee en Mediterranee" au lieu de "Plongée en Méditerranée".
9. **Services vides** : Le Poseidon Dive Club n'a aucun service associé (réponse vide).
10. **Centre "H2O Sainte Maxime" sans coordonnées** : Présent dans la liste mais absent de `/centers/geo`, invisible sur la carte.

### AMÉLIORATIONS

11. **Blog et FAQ absents du sitemap** : Pas de référencement des 8 articles de blog ni de la page FAQ.
12. **Faute d'orthographe** : "Instantané" → "Instantanée" dans la traduction FR.
13. **Chargement lent des centres** : ~5s de spinner avant affichage du globe interactif.
14. **Contenu sous le fold** : L'animation océan occupe tout le viewport, le contenu réel nécessite un scroll sur chaque page.

---

_Fin de l'analyse en production._
