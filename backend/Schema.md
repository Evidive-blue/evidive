-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public._sqlx_migrations (
  version bigint NOT NULL,
  description text NOT NULL,
  installed_on timestamp with time zone NOT NULL DEFAULT now(),
  success boolean NOT NULL,
  checksum bytea NOT NULL,
  execution_time bigint NOT NULL,
  CONSTRAINT _sqlx_migrations_pkey PRIMARY KEY (version)
);
CREATE TABLE public.blocked_dates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  center_id uuid NOT NULL,
  blocked_date date NOT NULL,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT blocked_dates_pkey PRIMARY KEY (id),
  CONSTRAINT blocked_dates_center_id_fkey FOREIGN KEY (center_id) REFERENCES public.centers(id)
);
CREATE TABLE public.bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL,
  center_id uuid NOT NULL,
  client_id uuid NOT NULL,
  booking_date date NOT NULL,
  time_slot time without time zone NOT NULL,
  participants integer NOT NULL DEFAULT 1,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::booking_status,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  commission_rate numeric NOT NULL DEFAULT 20.00,
  commission_amount numeric NOT NULL,
  currency text DEFAULT 'EUR'::text,
  client_note text,
  center_note text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  confirmed_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  completed_at timestamp with time zone,
  deleted_at timestamp with time zone,
  CONSTRAINT bookings_pkey PRIMARY KEY (id),
  CONSTRAINT bookings_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id),
  CONSTRAINT bookings_center_id_fkey FOREIGN KEY (center_id) REFERENCES public.centers(id),
  CONSTRAINT bookings_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.centers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  address text,
  city text,
  region text,
  country text NOT NULL,
  postal_code text,
  latitude numeric,
  longitude numeric,
  email text NOT NULL,
  phone text,
  website text,
  facebook_url text,
  instagram_url text,
  dive_types ARRAY DEFAULT '{}'::text[],
  languages ARRAY DEFAULT '{fr}'::text[],
  certifications ARRAY DEFAULT '{}'::text[],
  payment_methods ARRAY DEFAULT '{card}'::text[],
  eco_commitment boolean DEFAULT false,
  opening_hours jsonb,
  logo_url text,
  cover_url text,
  images ARRAY DEFAULT '{}'::text[],
  price_from numeric,
  currency text DEFAULT 'EUR'::text,
  stripe_account_id text,
  stripe_onboarding_complete boolean DEFAULT false,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::center_status,
  is_featured boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT centers_pkey PRIMARY KEY (id),
  CONSTRAINT centers_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.coupon_sources (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  discount_type text NOT NULL CHECK (discount_type = ANY (ARRAY['percent'::text, 'fixed'::text])),
  discount_value numeric NOT NULL CHECK (discount_value > 0::numeric),
  currency text NOT NULL DEFAULT 'EUR'::text,
  max_claims integer,
  claims_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT coupon_sources_pkey PRIMARY KEY (id)
);
CREATE TABLE public.coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  source_id uuid,
  center_id uuid,
  user_id uuid,
  discount_type text NOT NULL CHECK (discount_type = ANY (ARRAY['percent'::text, 'fixed'::text])),
  discount_value numeric NOT NULL CHECK (discount_value > 0::numeric),
  currency text NOT NULL DEFAULT 'EUR'::text,
  min_amount numeric,
  max_uses integer NOT NULL DEFAULT 1,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT coupons_pkey PRIMARY KEY (id),
  CONSTRAINT coupons_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.coupon_sources(id),
  CONSTRAINT coupons_center_id_fkey FOREIGN KEY (center_id) REFERENCES public.centers(id),
  CONSTRAINT coupons_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.holidays (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  center_id uuid NOT NULL,
  staff_id uuid,
  title text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT holidays_pkey PRIMARY KEY (id),
  CONSTRAINT holidays_center_id_fkey FOREIGN KEY (center_id) REFERENCES public.centers(id),
  CONSTRAINT holidays_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id)
);
CREATE TABLE public.locations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  latitude numeric,
  longitude numeric,
  depth_max integer,
  difficulty text,
  country text,
  region text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT locations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  role USER-DEFINED NOT NULL DEFAULT 'diver'::user_role,
  first_name text,
  last_name text,
  display_name text,
  avatar_url text,
  phone text,
  preferred_locale text DEFAULT 'fr'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.ref_certifications (
  code text NOT NULL,
  name text NOT NULL,
  organization text NOT NULL,
  level integer,
  CONSTRAINT ref_certifications_pkey PRIMARY KEY (code)
);
CREATE TABLE public.ref_countries (
  code text NOT NULL,
  name_fr text NOT NULL,
  name_en text NOT NULL,
  name_de text NOT NULL,
  name_es text NOT NULL DEFAULT ''::text,
  name_it text NOT NULL DEFAULT ''::text,
  name_pt text NOT NULL DEFAULT ''::text,
  name_nl text NOT NULL DEFAULT ''::text,
  CONSTRAINT ref_countries_pkey PRIMARY KEY (code)
);
CREATE TABLE public.ref_dive_types (
  code text NOT NULL,
  name_fr text NOT NULL,
  name_en text NOT NULL,
  name_de text NOT NULL,
  name_es text NOT NULL DEFAULT ''::text,
  name_it text NOT NULL DEFAULT ''::text,
  name_pt text NOT NULL DEFAULT ''::text,
  name_nl text NOT NULL DEFAULT ''::text,
  CONSTRAINT ref_dive_types_pkey PRIMARY KEY (code)
);
CREATE TABLE public.ref_service_categories (
  code text NOT NULL,
  name_fr text NOT NULL,
  name_en text NOT NULL,
  name_de text NOT NULL,
  icon text,
  name_es text NOT NULL DEFAULT ''::text,
  name_it text NOT NULL DEFAULT ''::text,
  name_pt text NOT NULL DEFAULT ''::text,
  name_nl text NOT NULL DEFAULT ''::text,
  CONSTRAINT ref_service_categories_pkey PRIMARY KEY (code)
);
CREATE TABLE public.refunds (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  currency text NOT NULL DEFAULT 'EUR'::text,
  reason text,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  processed_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT refunds_pkey PRIMARY KEY (id),
  CONSTRAINT refunds_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id),
  CONSTRAINT refunds_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE,
  center_id uuid NOT NULL,
  client_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  reply text,
  replied_at timestamp with time zone,
  is_published boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id),
  CONSTRAINT reviews_center_id_fkey FOREIGN KEY (center_id) REFERENCES public.centers(id),
  CONSTRAINT reviews_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.service_extras (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR'::text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT service_extras_pkey PRIMARY KEY (id)
);
CREATE TABLE public.services (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  center_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  category text,
  duration_minutes integer NOT NULL DEFAULT 60,
  max_capacity integer NOT NULL DEFAULT 1,
  min_participants integer DEFAULT 1,
  price numeric NOT NULL,
  currency text DEFAULT 'EUR'::text,
  min_certification text,
  min_dives integer,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT services_pkey PRIMARY KEY (id),
  CONSTRAINT services_center_id_fkey FOREIGN KEY (center_id) REFERENCES public.centers(id)
);
CREATE TABLE public.spatial_ref_sys (
  srid integer NOT NULL CHECK (srid > 0 AND srid <= 998999),
  auth_name character varying,
  auth_srid integer,
  srtext character varying,
  proj4text character varying,
  CONSTRAINT spatial_ref_sys_pkey PRIMARY KEY (srid)
);
CREATE TABLE public.staff (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  center_id uuid NOT NULL,
  profile_id uuid,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  role_label text NOT NULL DEFAULT 'instructor'::text,
  bio text,
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT staff_pkey PRIMARY KEY (id),
  CONSTRAINT staff_center_id_fkey FOREIGN KEY (center_id) REFERENCES public.centers(id),
  CONSTRAINT staff_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.staff_hours (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL,
  day_of_week smallint NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  CONSTRAINT staff_hours_pkey PRIMARY KEY (id),
  CONSTRAINT staff_hours_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id)
);
CREATE TABLE public.t_platform_config (
  key text NOT NULL,
  value text NOT NULL DEFAULT ''::text,
  category text NOT NULL CHECK (category = ANY (ARRAY['stripe'::text, 'smtp'::text, 'google'::text, 'platform'::text])),
  is_secret boolean NOT NULL DEFAULT false,
  description text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT t_platform_config_pkey PRIMARY KEY (key),
  CONSTRAINT t_platform_config_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tags_pkey PRIMARY KEY (id)
);
CREATE TABLE public.tli_ce_ta (
  fk_center uuid NOT NULL,
  fk_tag uuid NOT NULL,
  CONSTRAINT tli_ce_ta_pkey PRIMARY KEY (fk_center, fk_tag),
  CONSTRAINT tli_ce_ta_fk_center_fkey FOREIGN KEY (fk_center) REFERENCES public.centers(id),
  CONSTRAINT tli_ce_ta_fk_tag_fkey FOREIGN KEY (fk_tag) REFERENCES public.tags(id)
);
CREATE TABLE public.tli_pr_ce (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  fk_profile uuid NOT NULL,
  fk_center uuid NOT NULL,
  role_in_center text NOT NULL DEFAULT 'owner'::text CHECK (role_in_center = ANY (ARRAY['owner'::text, 'staff'::text, 'employee'::text, 'manager'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tli_pr_ce_pkey PRIMARY KEY (id),
  CONSTRAINT tli_pr_ce_fk_profile_fkey FOREIGN KEY (fk_profile) REFERENCES public.profiles(id),
  CONSTRAINT tli_pr_ce_fk_center_fkey FOREIGN KEY (fk_center) REFERENCES public.centers(id)
);
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL,
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  amount numeric NOT NULL,
  platform_fee numeric NOT NULL,
  vendor_amount numeric NOT NULL,
  currency text DEFAULT 'EUR'::text,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::payment_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id)
);