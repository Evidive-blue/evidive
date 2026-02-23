/**
 * Client API EviDive — connexion au backend Rust via Supabase Auth.
 *
 * Authentication: Supabase Auth SDK handles login/register/session.
 * Data calls: JWT from Supabase session sent as Bearer token to our Rust backend.
 * Base URL resolved by getApiUrl() from site-config.ts.
 */

import { getApiUrl } from "./site-config";
import { supabase, getSupabaseToken } from "./supabase";

/** All data endpoints live under /api/v1 on the Rust backend. */
const API_BASE = `${getApiUrl().replace(/\/$/, "")}/api/v1`;

export interface ApiErrorResponse {
  error?: string;
  message?: string;
}

// ─── Auth state helpers (synchronous, cached) ───

let _cachedRole: string | null = null;
let _cachedProfileComplete: boolean | null = null;
let _cachedCenterCount: number | null = null;

export function setCachedAuthState(
  role: string | null,
  profileComplete: boolean,
  centerCount: number
): void {
  _cachedRole = role;
  _cachedProfileComplete = profileComplete;
  _cachedCenterCount = centerCount;
}

export function clearCachedAuthState(): void {
  _cachedRole = null;
  _cachedProfileComplete = null;
  _cachedCenterCount = null;
}

/**
 * Synchronous auth check for UI rendering.
 * Uses Supabase local storage key to detect session presence.
 */
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  // Supabase stores session in localStorage under a predictable key pattern
  const keys = Object.keys(localStorage);
  return keys.some((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));
}

export function isAdmin(): boolean {
  return isAuthenticated() && _cachedRole === "admin_diver";
}

export function isDiver(): boolean {
  return isAuthenticated();
}

export function isCenterOwner(): boolean {
  return isAuthenticated() && (_cachedCenterCount ?? 0) > 0;
}

export function isProfileComplete(): boolean {
  return _cachedProfileComplete === true;
}

// Legacy compat: some components still reference these
export function getUserAdmin(): boolean {
  return _cachedRole === "admin_diver";
}

export function setUserAdmin(_admin: boolean): void {
  // No-op: role comes from profile API now
}

export function clearToken(): void {
  clearCachedAuthState();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth-change"));
  }
}

// ─── Core fetch wrapper ───

/**
 * Validate that a URL is a safe relative path (prevents open redirect).
 * Returns the path if safe, or "/" as fallback.
 */
export function sanitizeReturnUrl(url: string | null | undefined): string {
  if (!url) return "/";
  // Must start with "/" and must NOT start with "//" (protocol-relative)
  if (!url.startsWith("/") || url.startsWith("//")) return "/";
  // Block javascript: and data: URIs that could be encoded
  const decoded = decodeURIComponent(url).toLowerCase();
  if (decoded.includes("javascript:") || decoded.includes("data:")) return "/";
  return url;
}

async function fetchApi<T>(
  path: string,
  options: RequestInit & { token?: string | null; skipAuth?: boolean } = {}
): Promise<T> {
  const { token: explicitToken, skipAuth, ...init } = options;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const authToken = explicitToken ?? (await getSupabaseToken());
    if (authToken) {
      (headers as Record<string, string>)["Authorization"] =
        `Bearer ${authToken}`;
    }
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
    });
  } catch (networkErr: unknown) {
    const message =
      networkErr instanceof Error ? networkErr.message : "Network error";
    throw new Error(`Network request failed: ${message}`);
  }

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      const isPublicPage =
        currentPath.includes("/login") ||
        currentPath.includes("/register") ||
        currentPath.includes("/forgot-password") ||
        currentPath.includes("/reset-password") ||
        currentPath.includes("/onboard");
      const isSilentCheck = path === "/profile/me";

      if (!isPublicPage && !isSilentCheck) {
        await supabase.auth.signOut();
        clearCachedAuthState();
        const returnUrl = encodeURIComponent(
          currentPath + window.location.search
        );
        window.location.href = `/login?returnUrl=${returnUrl}`;
      }
    }

    let errBody: ApiErrorResponse = {};
    try {
      errBody = (await res.json()) as ApiErrorResponse;
    } catch (_parseErr: unknown) {
      // Response body is not JSON — use status text as fallback
    }
    const msg =
      errBody.error ??
      errBody.message ??
      res.statusText ??
      `HTTP ${res.status}`;
    throw new Error(msg);
  }

  if (res.status === 204) {
    return {} as T;
  }

  const json: unknown = await res.json();

  // The Rust backend wraps every response in { "data": <payload> }.
  // Unwrap it transparently so frontend callers receive the payload directly.
  if (
    json !== null &&
    typeof json === "object" &&
    "data" in (json as Record<string, unknown>) &&
    Object.keys(json as Record<string, unknown>).every(
      (k) => k === "data" || k === "pagination" || k === "meta"
    )
  ) {
    return (json as Record<string, unknown>).data as T;
  }

  return json as T;
}

// ─── Auth (Supabase SDK) ───

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface LoginResponse {
  token: string;
  user: UserResponse;
}

export interface UserResponse {
  id: string;
  email?: string | null;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  preferred_locale: string | null;
  created_at: string;
  updated_at?: string;
  username?: string | null;
  status?: string | null;
  admin?: boolean;
  email_verified?: boolean;
  diver_profile?: Record<string, unknown> | null;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirm_password: string;
}

export const authApi = {
  /** Sign in with Supabase Auth, then fetch profile from our backend. */
  async login(body: LoginRequest): Promise<{
    token: string;
    user: UserResponse;
    profileComplete: boolean;
    centerCount: number;
  }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });
    if (error) {
      throw new Error(error.message);
    }

    const token = data.session.access_token;
    const user = await fetchApi<UserResponse>("/profile/me", { token });

    // Cache auth state from the response (not from stale cache)
    const profileComplete = !!(user.first_name && user.last_name);
    let centerCount = 0;
    try {
      const centers = await fetchApi<Array<{ id: string }>>(
        "/profile/centers",
        { token }
      );
      centerCount = centers.length;
    } catch (_centersErr: unknown) {
      // Profile might not have centers yet — default to 0
    }
    setCachedAuthState(user.role, profileComplete, centerCount);

    // Attach resolved auth state to the response so callers
    // can use it directly without relying on the cache.
    const loginResult = {
      token,
      user,
      profileComplete,
      centerCount,
    };

    window.dispatchEvent(new Event("auth-change"));
    return loginResult;
  },

  /** Register with Supabase Auth. Profile row created via DB trigger. */
  async register(body: RegisterRequest): Promise<UserResponse> {
    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: {
          first_name: body.first_name ?? null,
          last_name: body.last_name ?? null,
        },
      },
    });
    if (error) {
      throw new Error(error.message);
    }

    // If email confirmation is required, user won't have a session yet
    if (!data.session) {
      return {
        id: data.user?.id ?? "",
        email: body.email,
        first_name: body.first_name ?? null,
        last_name: body.last_name ?? null,
        display_name: null,
        phone: null,
        avatar_url: null,
        role: "diver",
        preferred_locale: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    // Auto-login: fetch profile
    const token = data.session.access_token;
    const user = await fetchApi<UserResponse>("/profile/me", { token });
    setCachedAuthState(user.role, false, 0);
    window.dispatchEvent(new Event("auth-change"));
    return user;
  },

  /** Sign in via Google OAuth (Supabase handles the redirect flow). */
  async loginWithGoogle(): Promise<void> {
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      throw new Error(error.message);
    }
  },

  /** Fetch current user profile from our Rust backend. */
  me: (): Promise<UserResponse> => fetchApi<UserResponse>("/profile/me"),

  /** Sign out from Supabase. */
  async logout(): Promise<{ message: string }> {
    await supabase.auth.signOut();
    clearCachedAuthState();
    window.dispatchEvent(new Event("auth-change"));
    return { message: "ok" };
  },

  /** Request password reset via Supabase. */
  async forgotPassword(
    body: ForgotPasswordRequest
  ): Promise<{ message: string }> {
    const { error } = await supabase.auth.resetPasswordForEmail(body.email);
    if (error) {
      throw new Error(error.message);
    }
    return { message: "ok" };
  },

  /** Update password via Supabase. */
  async resetPassword(
    body: ResetPasswordRequest
  ): Promise<{ message: string }> {
    const { error } = await supabase.auth.updateUser({
      password: body.password,
    });
    if (error) {
      throw new Error(error.message);
    }
    return { message: "ok" };
  },
};

// ─── Profile ───

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  phone?: string;
  preferred_locale?: string;
  avatar_url?: string;
}

export const profileApi = {
  getMe: (): Promise<UserResponse> => fetchApi<UserResponse>("/profile/me"),
  updateMe: (body: UpdateProfileRequest): Promise<UserResponse> =>
    fetchApi<UserResponse>("/profile/me", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  getMyCenters: (): Promise<CenterResponse[]> =>
    fetchApi<CenterResponse[]>("/profile/centers"),
};

// ─── Centers (public) ───

export interface CenterResponse {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  country: string;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  email: string;
  phone: string | null;
  website: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  dive_types: string[];
  languages: string[];
  certifications: string[];
  payment_methods: string[];
  eco_commitment: boolean;
  opening_hours: Record<string, unknown> | null;
  logo_url: string | null;
  cover_url: string | null;
  images: string[];
  price_from: number | null;
  currency: string;
  status: string;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  display_name?: string | null;
  zip?: string | null;
  verified?: boolean;
}

export type PublicCenter = CenterResponse & {
  average_rating?: number | null;
  review_count?: number | null;
};

export interface GeoPin {
  id: string;
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
}

export interface CreateCenterRequest {
  name: string;
  description?: string;
  country: string;
  city?: string;
  address?: string;
  postal_code?: string;
  region?: string;
  email: string;
  phone?: string;
  website?: string;
  dive_types?: string[];
  languages?: string[];
  certifications?: string[];
  latitude?: number;
  longitude?: number;
}

export const centersApi = {
  list: (params?: {
    country?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PublicCenter[]> => {
    const q = new URLSearchParams();
    if (params?.country) {
      q.set("country", params.country);
    }
    if (params?.search) {
      q.set("search", params.search);
    }
    if (params?.page) {
      q.set("page", String(params.page));
    }
    if (params?.limit) {
      q.set("limit", String(params.limit));
    }
    const qs = q.toString();
    return fetchApi<PublicCenter[]>(`/centers${qs ? `?${qs}` : ""}`, {
      skipAuth: true,
    });
  },
  getBySlug: (slug: string): Promise<PublicCenter> =>
    fetchApi<PublicCenter>(`/centers/${encodeURIComponent(slug)}`, {
      skipAuth: true,
    }),
  getById: (id: string): Promise<CenterResponse> =>
    fetchApi<CenterResponse>(`/centers/id/${id}`, { skipAuth: true }),
  getGeo: (): Promise<GeoPin[]> =>
    fetchApi<GeoPin[]>("/centers/geo", { skipAuth: true }),
  create: (body: CreateCenterRequest): Promise<CenterResponse> =>
    fetchApi<CenterResponse>("/centers", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (
    slug: string,
    body: Partial<CenterResponse>
  ): Promise<CenterResponse> =>
    fetchApi<CenterResponse>(`/centers/${encodeURIComponent(slug)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};

// ─── Services ───

export interface ServiceResponse {
  id: string;
  center_id: string;
  name: string;
  description: string | null;
  category: string | null;
  duration_minutes: number;
  max_capacity: number;
  min_participants: number | null;
  price: number | string;
  currency: string;
  min_certification: string | null;
  min_dives: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  capacity?: number;
}

// Legacy alias for components using PublicService
export type PublicService = ServiceResponse;

export interface CreateServiceRequest {
  name: string;
  description?: string;
  category?: string;
  category_id?: string;
  duration_minutes: number;
  max_capacity?: number;
  min_participants?: number;
  capacity?: number;
  price: number | string;
  currency?: string;
  min_certification?: string;
  min_dives?: number;
}

export type UpdateServiceRequest = Partial<CreateServiceRequest>;

export const servicesApi = {
  listByCenter: (slug: string): Promise<ServiceResponse[]> =>
    fetchApi<ServiceResponse[]>(
      `/centers/${encodeURIComponent(slug)}/services`,
      { skipAuth: true }
    ),
  listByCenterId: (centerId: string): Promise<ServiceResponse[]> =>
    fetchApi<ServiceResponse[]>(`/centers/id/${centerId}/services`, {
      skipAuth: true,
    }),
  create: (
    slug: string,
    body: CreateServiceRequest
  ): Promise<ServiceResponse> =>
    fetchApi<ServiceResponse>(`/centers/${encodeURIComponent(slug)}/services`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (
    slug: string,
    serviceId: string,
    body: Partial<CreateServiceRequest>
  ): Promise<ServiceResponse> =>
    fetchApi<ServiceResponse>(
      `/centers/${encodeURIComponent(slug)}/services/${serviceId}`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      }
    ),
  remove: (slug: string, serviceId: string): Promise<void> =>
    fetchApi<void>(
      `/centers/${encodeURIComponent(slug)}/services/${serviceId}`,
      {
        method: "DELETE",
      }
    ),
};

// ─── Reference data (public, no auth) ───

export interface RefCountry {
  code: string;
  name_fr: string;
  name_en: string;
  name_de: string;
  name_es: string;
  name_it: string;
  name_pt: string;
  name_nl: string;
}

export interface RefDiveType {
  code: string;
  name_fr: string;
  name_en: string;
  name_de: string;
  name_es: string;
  name_it: string;
  name_pt: string;
  name_nl: string;
}

export interface RefServiceCategory {
  code: string;
  name_fr: string;
  name_en: string;
  name_de: string;
  name_es: string;
  name_it: string;
  name_pt: string;
  name_nl: string;
  icon: string | null;
}

export interface RefCertification {
  code: string;
  name: string;
  organization: string;
  level: number | null;
}

export const referenceApi = {
  getCountries: (): Promise<RefCountry[]> =>
    fetchApi<RefCountry[]>("/reference/countries", { skipAuth: true }),
  getDiveTypes: (): Promise<RefDiveType[]> =>
    fetchApi<RefDiveType[]>("/reference/dive-types", { skipAuth: true }),
  getServiceCategories: (): Promise<RefServiceCategory[]> =>
    fetchApi<RefServiceCategory[]>("/reference/service-categories", {
      skipAuth: true,
    }),
  getCertifications: (): Promise<RefCertification[]> =>
    fetchApi<RefCertification[]>("/reference/certifications", {
      skipAuth: true,
    }),
};

// ─── Bookings ───

export interface AvailabilitySlot {
  start: string;
  end: string;
  start_time: string;
  end_time: string;
  available: boolean;
}

export interface BookingGuestInput {
  first_name: string;
  last_name: string;
}

export interface CouponValidationResponse {
  valid: boolean;
  coupon_id: string | null;
  discount_type: "percent" | "fixed" | null;
  discount_value: number | null;
  message: string;
}

export interface BookingUserInfo {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
}

export interface BookingResponse {
  id: string;
  service_id: string;
  center_id: string;
  client_id: string;
  booking_date: string;
  time_slot: string;
  participants: number;
  status: string;
  unit_price: number | string;
  total_price: number | string;
  commission_rate: number | string;
  commission_amount: number | string;
  currency: string;
  client_note: string | null;
  center_note: string | null;
  created_at: string;
  updated_at: string;
  /** Present when fetched from dashboard list */
  service?: { name: string };
  /** Present when fetched from dashboard list */
  client?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  };
  /** Present when fetched from dashboard list */
  assigned_user?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email?: string | null;
  } | null;
  /** Present when fetched from dashboard list */
  start_time?: string;
  end_time?: string | null;
  /** Present when fetched from dashboard list */
  price?: number | string;
  participants_count?: number;
  notes?: string | null;
  location?: { name?: string; address?: string; city?: string } | null;
  guests?: Array<{
    first_name?: string;
    last_name?: string;
    email?: string | null;
    phone?: string | null;
  }>;
}

export interface CreateBookingRequest {
  service_id: string;
  center_id: string;
  booking_date: string;
  time_slot: string;
  start_time?: string;
  end_time?: string;
  participants: number;
  client_note?: string;
}

export const bookingApi = {
  create: (body: CreateBookingRequest): Promise<BookingResponse> =>
    fetchApi<BookingResponse>("/bookings", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getAll: (params?: {
    status?: string;
    limit?: number;
  }): Promise<BookingResponse[]> => {
    const q = new URLSearchParams();
    if (params?.status) {
      q.set("status", params.status);
    }
    if (params?.limit !== null && params?.limit !== undefined) {
      q.set("limit", String(params.limit));
    }
    const qs = q.toString();
    return fetchApi<BookingResponse[]>(`/bookings${qs ? `?${qs}` : ""}`);
  },
  getById: (bookingId: string): Promise<BookingResponse> =>
    fetchApi<BookingResponse>(`/bookings/${bookingId}`),
  cancel: (bookingId: string): Promise<BookingResponse> =>
    fetchApi<BookingResponse>(`/bookings/${bookingId}/cancel`, {
      method: "POST",
    }),
  confirm: (bookingId: string): Promise<BookingResponse> =>
    fetchApi<BookingResponse>(`/bookings/${bookingId}/confirm`, {
      method: "POST",
    }),
  listByCenter: (slug: string): Promise<BookingResponse[]> =>
    fetchApi<BookingResponse[]>(
      `/centers/${encodeURIComponent(slug)}/bookings`
    ),
  checkAvailability: (params: {
    service_id: string;
    date: string;
  }): Promise<AvailabilitySlot[]> =>
    fetchApi<AvailabilitySlot[]>(
      `/bookings/availability?service_id=${encodeURIComponent(params.service_id)}&date=${encodeURIComponent(params.date)}`
    ),
};

// ─── Reviews ───

export interface ReviewResponse {
  id: string;
  booking_id: string;
  center_id: string;
  client_id: string;
  rating: number;
  comment: string | null;
  reply: string | null;
  replied_at: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  user_id?: string | null;
  status?: string | null;
  center_response?: string | null;
}

export interface CreateReviewRequest {
  booking_id: string;
  center_id: string;
  rating: number;
  comment?: string;
}

export const reviewApi = {
  getCenterReviews: (centerId: string): Promise<ReviewResponse[]> =>
    fetchApi<ReviewResponse[]>(`/reviews/center/${centerId}`, {
      skipAuth: true,
    }),
  getEligible: (centerId: string): Promise<ReviewResponse[]> =>
    fetchApi<ReviewResponse[]>(`/reviews/eligible/${centerId}`),
  getReviewableBookings: (centerId: string): Promise<string[]> =>
    fetchApi<string[]>(`/reviews/reviewable-bookings/${centerId}`),
  create: (body: CreateReviewRequest): Promise<ReviewResponse> =>
    fetchApi<ReviewResponse>("/reviews", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  listByCenter: (slug: string): Promise<ReviewResponse[]> =>
    fetchApi<ReviewResponse[]>(`/centers/${encodeURIComponent(slug)}/reviews`),
  reply: (
    slug: string,
    reviewId: string,
    replyText: string
  ): Promise<ReviewResponse> =>
    fetchApi<ReviewResponse>(
      `/centers/${encodeURIComponent(slug)}/reviews/${reviewId}/reply`,
      {
        method: "POST",
        body: JSON.stringify({ reply: replyText }),
      }
    ),
};

// ─── Admin ───

/**
 * Mirrors the Rust `AdminStats` struct returned by `GET /api/v1/admin/stats`.
 * The backend returns flat counts; the frontend uses these directly.
 */
export interface AdminStats {
  pending_centers: number;
  active_centers: number;
  total_users: number;
  total_bookings: number;
  total_reviews: number;
}

export interface CommissionResponse {
  id: string;
  center_name: string | null;
  total_price: number | string;
  commission_amount: number | string;
  currency: string;
  status: string;
  booking_date: string;
  created_at: string;
}

export interface AdminCommissionConfig {
  default_rate: number;
}

export interface CouponResponse {
  id: string;
  code: string;
  source_id: string | null;
  center_id: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  currency: string;
  min_amount: number | null;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface CreateCouponRequest {
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  currency?: string;
  max_uses?: number;
  expires_at?: string;
}

export interface CouponSourceResponse {
  id: string;
  slug: string;
  label: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  currency: string;
  max_claims: number | null;
  claims_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

// ─── Admin extras ───
export interface ServiceExtraResponse {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateServiceExtraRequest {
  name: string;
  price: number;
  description?: string;
  currency?: string;
  is_active?: boolean;
}

// ─── Admin locations ───
export interface LocationResponse {
  id: string;
  name: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  depth_max: number | null;
  difficulty: string | null;
  country: string | null;
  region: string | null;
  created_at: string;
}

export interface CreateLocationRequest {
  name: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  depth_max?: number;
  difficulty?: string;
  country?: string;
  region?: string;
}

// ─── Admin notifications ───
export interface AdminNotification {
  id: string;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

// ─── Admin payments ───
export interface PaymentDetailResponse {
  id: string;
  center_name: string | null;
  total_price: number | string;
  commission_amount: number | string;
  currency: string;
  status: string;
  booking_date: string;
  created_at: string;
}

export interface AdminPaymentFilters {
  status?: string;
  date_from?: string;
  date_to?: string;
}

// ─── Calendar / plannings ───
export interface CalendarEvent {
  id: string;
  type: string;
  title: string;
  start_time: string;
  end_time: string;
  booking_id: string | null;
}

// ─── Admin refunds ───
export interface RefundResponse {
  id: string;
  booking_id: string;
  amount: number | string;
  currency: string;
  reason: string | null;
  status: string;
  created_at: string;
}

// ─── Admin reports ───
export interface AdminReportStats {
  total_bookings: number;
  total_revenue: number | string;
  total_commissions: number | string;
  total_reviews: number;
  average_rating: number | null;
  date_from: string;
  date_to: string;
}

// ─── Admin settings ───
export interface AdminSettingsMarketplace {
  commission_rate: number;
  booking_advance_days: number;
  cancellation_hours: number;
  min_booking_notice_hours: number;
  max_participants_per_booking: number;
  auto_approve_centers: boolean;
}

export interface AdminSettingsCompany {
  company_name: string;
  legal_name: string;
  address: string;
  city: string;
  zip: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  vat_number: string;
  registration_number: string;
}

export interface AdminSettingsCurrency {
  default_currency: string;
  display_format: string;
  decimal_separator: string;
  thousand_separator: string;
}

export interface AdminSettingsDisplay {
  centers_per_page: number;
  services_per_page: number;
  reviews_per_page: number;
  default_locale: string;
  show_map: boolean;
  show_ratings: boolean;
}

export interface AdminSettingsGlobal {
  google_analytics_id: string;
  stripe_mode: "test" | "live";
  maintenance_mode: boolean;
  registration_enabled: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
}

// ─── Admin vendors ───
export interface VendorResponse {
  id: string;
  name: string;
  slug: string;
  email: string;
  city: string | null;
  country: string | null;
  status: string;
  commission_rate: number | null;
  total_revenue: string;
  created_at: string;
}

// ─── Dashboard / center owner ───
export interface BlockedDateResponse {
  id: string;
  blocked_date: string;
  reason: string | null;
  created_at: string;
}

export interface HolidayResponse {
  id: string;
  staff_id: string | null;
  title: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface HolidayRequest {
  staff_id?: string | null;
  title?: string;
  start_date: string;
  end_date: string;
}

export interface StaffMember {
  id: string;
  center_id: string;
  profile_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  role_label: string;
  bio: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CenterStats {
  bookings: { total: number; pending?: number };
  services: { total: number; active?: number };
  revenue: { total_cents: number };
}

export interface CenterKPIs {
  bookings: { total: number; pending?: number };
  services: { total: number; active?: number };
  billable_hours: number;
  usable_hours: number;
  utilization_rate: number;
  average_booking_value: number;
  revenue_this_month: number;
  revenue_last_month: number;
  bookings_this_month: number;
  bookings_last_month: number;
  cancellation_rate: number;
  upcoming_bookings: number;
}

/** Raw KPI response shape from the Rust backend (`GET /centers/{slug}/kpis`). */
interface BackendCenterKpis {
  total_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  total_revenue: string;
  total_commission: string;
  net_revenue: string;
  average_rating: number | null;
  total_reviews: number;
  active_services: number;
  currency: string;
}

export interface PaymentResponse {
  id: string;
  booking_id: string;
  stripe_payment_intent_id: string | null;
  amount: number | string;
  platform_fee: number | string;
  vendor_amount: number | string;
  currency: string;
  status: string;
  created_at: string;
}

export interface RevenueResponse {
  center_id: string;
  total_revenue: number | string;
  total_commission: number | string;
  net_revenue: number | string;
  pending_revenue: number | string;
  completed_revenue: number | string;
  transaction_count: number;
  currency: string;
}

export interface StripePayoutConfig {
  center_id: string;
  center_name: string;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean | null;
  currency: string;
}

/** Backend returns the same StaffRow shape for detail as for list. */
export interface StaffDetailResponse {
  id: string;
  center_id: string;
  profile_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  role_label: string;
  bio: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateStaffRequest {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  role_label?: string;
  bio?: string;
}

export interface UpdateStaffMemberRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role_label?: string;
  is_active?: boolean;
}

export interface WorkingHoursDay {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

// ──────────── Center Members (tli_pr_ce) ────────────

export interface CenterMember {
  id: string;
  fk_profile: string;
  fk_center: string;
  role_in_center: string;
  created_at: string;
  profile_email: string | null;
  profile_first_name: string | null;
  profile_last_name: string | null;
}

export interface AddMemberRequest {
  email: string;
  role_in_center: string;
}

export interface UpdateMemberRoleRequest {
  role_in_center: string;
}

export interface CouponClaimResponse {
  source: { slug: string };
  coupon: { id: string; code: string };
}

export const adminApi = {
  getStats: (): Promise<AdminStats> => fetchApi<AdminStats>("/admin/stats"),
  getCategories: (): Promise<RefServiceCategory[]> =>
    referenceApi.getServiceCategories(),
  getCenter: (centerId: string): Promise<PublicCenter> =>
    fetchApi<PublicCenter>(`/centers/id/${centerId}`, { skipAuth: true }),
  updateCenter: (
    centerId: string,
    body: Partial<CenterResponse>
  ): Promise<CenterResponse> =>
    fetchApi<CenterResponse>(`/admin/centers/${centerId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  getCenters: (): Promise<CenterResponse[]> =>
    fetchApi<CenterResponse[]>("/admin/centers"),
  getPendingCenters: (): Promise<CenterResponse[]> =>
    fetchApi<CenterResponse[]>("/admin/centers/pending"),
  updateCenterStatus: (
    centerId: string,
    status: string
  ): Promise<CenterResponse> =>
    fetchApi<CenterResponse>(`/admin/centers/${centerId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  approveCenter: (centerId: string): Promise<CenterResponse> =>
    fetchApi<CenterResponse>(`/admin/centers/${centerId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "active" }),
    }),
  rejectCenter: (centerId: string): Promise<CenterResponse> =>
    fetchApi<CenterResponse>(`/admin/centers/${centerId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "rejected" }),
    }),
  getUsers: (): Promise<UserResponse[]> =>
    fetchApi<UserResponse[]>("/admin/users"),
  updateUserRole: (userId: string, role: string): Promise<UserResponse> =>
    fetchApi<UserResponse>(`/admin/users/${userId}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
  updateUser: (
    userId: string,
    body: {
      first_name?: string | null;
      last_name?: string | null;
      email?: string;
      phone?: string | null;
      username?: string | null;
      admin?: boolean;
    }
  ): Promise<UserResponse> =>
    fetchApi<UserResponse>(`/admin/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  getUser: (userId: string): Promise<UserResponse> =>
    fetchApi<UserResponse>(`/admin/users/${userId}`),
  deleteUser: (userId: string): Promise<void> =>
    fetchApi<void>(`/admin/users/${userId}`, { method: "DELETE" }),
  blacklistUser: (userId: string): Promise<UserResponse> =>
    fetchApi<UserResponse>(`/admin/users/${userId}/blacklist`, {
      method: "POST",
    }),
  unblacklistUser: (userId: string): Promise<UserResponse> =>
    fetchApi<UserResponse>(`/admin/users/${userId}/unblacklist`, {
      method: "POST",
    }),
  approveReview: (reviewId: string): Promise<ReviewResponse> =>
    fetchApi<ReviewResponse>(`/admin/reviews/${reviewId}/approve`, {
      method: "POST",
    }),
  deleteService: (serviceId: string): Promise<void> =>
    fetchApi<void>(`/admin/services/${serviceId}`, { method: "DELETE" }),
  getTags: (): Promise<Array<{ id: string; name: string }>> =>
    fetchApi<Array<{ id: string; name: string }>>("/admin/tags"),
  createTag: (body: { name: string }): Promise<{ id: string; name: string }> =>
    fetchApi<{ id: string; name: string }>("/admin/tags", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  deleteTag: (tagId: string): Promise<void> =>
    fetchApi<void>(`/admin/tags/${tagId}`, { method: "DELETE" }),
  getCommissionConfig: (): Promise<AdminCommissionConfig> =>
    fetchApi<AdminCommissionConfig>("/admin/commissions/config"),
  getCommissions: (): Promise<CommissionResponse[]> =>
    fetchApi<CommissionResponse[]>("/admin/commissions"),
  updateCommissionConfig: (
    body: AdminCommissionConfig
  ): Promise<AdminCommissionConfig> =>
    fetchApi<AdminCommissionConfig>("/admin/commissions/config", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  markCommissionPaid: (commissionId: string): Promise<CommissionResponse> =>
    fetchApi<CommissionResponse>(`/admin/commissions/${commissionId}/pay`, {
      method: "POST",
    }),
  markCommissionsPaidBulk: (
    commissionIds: string[]
  ): Promise<CommissionResponse[]> =>
    fetchApi<CommissionResponse[]>("/admin/commissions/bulk-pay", {
      method: "POST",
      body: JSON.stringify({ commission_ids: commissionIds }),
    }),
  getBookings: (): Promise<BookingResponse[]> =>
    fetchApi<BookingResponse[]>("/admin/bookings"),
  updateBookingStatus: (
    bookingId: string,
    status: string
  ): Promise<BookingResponse> =>
    fetchApi<BookingResponse>(`/admin/bookings/${bookingId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  getReviews: (): Promise<ReviewResponse[]> =>
    fetchApi<ReviewResponse[]>("/admin/reviews"),
  toggleReviewPublish: (
    reviewId: string,
    published: boolean
  ): Promise<ReviewResponse> =>
    fetchApi<ReviewResponse>(`/admin/reviews/${reviewId}/publish`, {
      method: "PATCH",
      body: JSON.stringify({ is_published: published }),
    }),
  deleteReview: (reviewId: string): Promise<void> =>
    fetchApi<void>(`/admin/reviews/${reviewId}`, { method: "DELETE" }),
  getSettings: (): Promise<
    Array<{
      key: string;
      value: string;
      category: string;
      is_secret: boolean;
      description: string | null;
    }>
  > => fetchApi("/admin/settings"),
  updateSetting: (key: string, value: string): Promise<void> =>
    fetchApi<void>(`/admin/settings/${encodeURIComponent(key)}`, {
      method: "PUT",
      body: JSON.stringify({ value }),
    }),

  // ── Coupons ──
  getCoupons: (): Promise<CouponResponse[]> =>
    fetchApi<CouponResponse[]>("/admin/coupons"),
  createCoupon: (body: CreateCouponRequest): Promise<CouponResponse> =>
    fetchApi<CouponResponse>("/admin/coupons", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateCoupon: (
    couponId: string,
    body: CreateCouponRequest
  ): Promise<CouponResponse> =>
    fetchApi<CouponResponse>(`/admin/coupons/${couponId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteCoupon: (couponId: string): Promise<void> =>
    fetchApi<void>(`/admin/coupons/${couponId}`, { method: "DELETE" }),
  getCouponSources: (): Promise<CouponSourceResponse[]> =>
    fetchApi<CouponSourceResponse[]>("/admin/coupon-sources"),
  updateCouponSource: (
    sourceId: string,
    body: Partial<Omit<CouponSourceResponse, "id" | "slug" | "created_at">>
  ): Promise<CouponSourceResponse> =>
    fetchApi<CouponSourceResponse>(`/admin/coupon-sources/${sourceId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  getExtras: (): Promise<ServiceExtraResponse[]> =>
    fetchApi<ServiceExtraResponse[]>("/admin/extras"),
  getServices: (): Promise<ServiceResponse[]> =>
    fetchApi<ServiceResponse[]>("/admin/services"),
  createExtra: (
    body: CreateServiceExtraRequest
  ): Promise<ServiceExtraResponse> =>
    fetchApi<ServiceExtraResponse>("/admin/extras", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateExtra: (
    id: string,
    body: Partial<CreateServiceExtraRequest>
  ): Promise<ServiceExtraResponse> =>
    fetchApi<ServiceExtraResponse>(`/admin/extras/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteExtra: (id: string): Promise<void> =>
    fetchApi<void>(`/admin/extras/${id}`, { method: "DELETE" }),

  getLocations: (): Promise<LocationResponse[]> =>
    fetchApi<LocationResponse[]>("/admin/locations"),
  createLocation: (body: CreateLocationRequest): Promise<LocationResponse> =>
    fetchApi<LocationResponse>("/admin/locations", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateLocation: (
    id: string,
    body: Partial<CreateLocationRequest>
  ): Promise<LocationResponse> =>
    fetchApi<LocationResponse>(`/admin/locations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteLocation: (id: string): Promise<void> =>
    fetchApi<void>(`/admin/locations/${id}`, { method: "DELETE" }),

  getNotifications: (): Promise<AdminNotification[]> =>
    fetchApi<AdminNotification[]>("/admin/notifications"),
  markAllNotificationsRead: (): Promise<void> =>
    fetchApi<void>("/admin/notifications/read-all", { method: "POST" }),
  markNotificationRead: (id: string): Promise<void> =>
    fetchApi<void>(`/admin/notifications/${id}/read`, { method: "POST" }),

  getPayments: (
    filters?: AdminPaymentFilters
  ): Promise<PaymentDetailResponse[]> => {
    const q = new URLSearchParams();
    if (filters?.status) {
      q.set("status", filters.status);
    }
    if (filters?.date_from) {
      q.set("date_from", filters.date_from);
    }
    if (filters?.date_to) {
      q.set("date_to", filters.date_to);
    }
    const qs = q.toString();
    return fetchApi<PaymentDetailResponse[]>(
      `/admin/payments${qs ? `?${qs}` : ""}`
    );
  },

  getPlannings: (params?: {
    center_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<CalendarEvent[]> => {
    const q = new URLSearchParams();
    if (params?.center_id) {
      q.set("center_id", params.center_id);
    }
    if (params?.date_from) {
      q.set("date_from", params.date_from);
    }
    if (params?.date_to) {
      q.set("date_to", params.date_to);
    }
    const qs = q.toString();
    return fetchApi<CalendarEvent[]>(`/admin/plannings${qs ? `?${qs}` : ""}`);
  },

  getRefunds: (params?: { status?: string }): Promise<RefundResponse[]> => {
    const q = params?.status
      ? `?status=${encodeURIComponent(params.status)}`
      : "";
    return fetchApi<RefundResponse[]>(`/admin/refunds${q}`);
  },
  approveRefund: (id: string): Promise<RefundResponse> =>
    fetchApi<RefundResponse>(`/admin/refunds/${id}/approve`, {
      method: "POST",
    }),
  rejectRefund: (id: string): Promise<RefundResponse> =>
    fetchApi<RefundResponse>(`/admin/refunds/${id}/reject`, { method: "POST" }),

  getReports: (params?: {
    date_from?: string;
    date_to?: string;
  }): Promise<AdminReportStats> => {
    const q = new URLSearchParams();
    if (params?.date_from) {
      q.set("date_from", params.date_from);
    }
    if (params?.date_to) {
      q.set("date_to", params.date_to);
    }
    const qs = q.toString();
    return fetchApi<AdminReportStats>(`/admin/reports${qs ? `?${qs}` : ""}`);
  },

  getSettingsMarketplace: (): Promise<AdminSettingsMarketplace> =>
    fetchApi<AdminSettingsMarketplace>("/admin/settings/marketplace"),
  updateSettingsMarketplace: (
    body: AdminSettingsMarketplace
  ): Promise<AdminSettingsMarketplace> =>
    fetchApi<AdminSettingsMarketplace>("/admin/settings/marketplace", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  getSettingsCompany: (): Promise<AdminSettingsCompany> =>
    fetchApi<AdminSettingsCompany>("/admin/settings/company"),
  updateSettingsCompany: (
    body: AdminSettingsCompany
  ): Promise<AdminSettingsCompany> =>
    fetchApi<AdminSettingsCompany>("/admin/settings/company", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  getSettingsCurrency: (): Promise<AdminSettingsCurrency> =>
    fetchApi<AdminSettingsCurrency>("/admin/settings/currency"),
  updateSettingsCurrency: (
    body: AdminSettingsCurrency
  ): Promise<AdminSettingsCurrency> =>
    fetchApi<AdminSettingsCurrency>("/admin/settings/currency", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  getSettingsDisplay: (): Promise<AdminSettingsDisplay> =>
    fetchApi<AdminSettingsDisplay>("/admin/settings/display"),
  updateSettingsDisplay: (
    body: AdminSettingsDisplay
  ): Promise<AdminSettingsDisplay> =>
    fetchApi<AdminSettingsDisplay>("/admin/settings/display", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  getSettingsGlobal: (): Promise<AdminSettingsGlobal> =>
    fetchApi<AdminSettingsGlobal>("/admin/settings/global"),
  updateSettingsGlobal: (
    body: AdminSettingsGlobal
  ): Promise<AdminSettingsGlobal> =>
    fetchApi<AdminSettingsGlobal>("/admin/settings/global", {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  getVendors: (): Promise<VendorResponse[]> =>
    fetchApi<VendorResponse[]>("/admin/vendors"),
  updateVendorCommission: (
    vendorId: string,
    rate: number
  ): Promise<VendorResponse> =>
    fetchApi<VendorResponse>(`/admin/vendors/${vendorId}/commission`, {
      method: "PATCH",
      body: JSON.stringify({ commission_rate: rate }),
    }),
  suspendVendor: (vendorId: string): Promise<VendorResponse> =>
    fetchApi<VendorResponse>(`/admin/vendors/${vendorId}/suspend`, {
      method: "POST",
    }),
  activateVendor: (vendorId: string): Promise<VendorResponse> =>
    fetchApi<VendorResponse>(`/admin/vendors/${vendorId}/activate`, {
      method: "POST",
    }),
};

// ─── Legacy compatibility exports ───
// Some reference components import these. Keep them working.

export function getToken(): string | null {
  // Synchronous — returns null; real token fetched async via fetchApi
  return null;
}

export function setToken(_token: string): void {
  // No-op: Supabase manages tokens
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth-change"));
  }
}

/** @deprecated Use centersApi instead */
export const publicApi = {
  getCenters: (): Promise<PublicCenter[]> => centersApi.list(),
  getCenterById: (id: string): Promise<PublicCenter> =>
    fetchApi<PublicCenter>(`/centers/id/${id}`, { skipAuth: true }),
  getCenterBySlug: (slug: string): Promise<PublicCenter> =>
    centersApi.getBySlug(slug),
  getServices: (centerId?: string): Promise<ServiceResponse[]> => {
    if (centerId) {
      return servicesApi.listByCenterId(centerId);
    }
    return fetchApi<ServiceResponse[]>("/centers", { skipAuth: true }).then(
      () => []
    );
  },
  getCategories: (): Promise<RefServiceCategory[]> =>
    referenceApi.getServiceCategories(),
};

/** @deprecated Use centersApi.create instead */
export const onboardApi = {
  createCenter: (body: CreateCenterRequest): Promise<CenterResponse> =>
    centersApi.create(body),
};

/** @deprecated Use bookingApi instead */
export const centerApi = {
  getBookings: (params?: {
    status?: string;
    limit?: number;
  }): Promise<BookingResponse[]> => {
    const q = new URLSearchParams();
    if (params?.status) {
      q.set("status", params.status);
    }
    if (params?.limit !== null && params?.limit !== undefined) {
      q.set("limit", String(params.limit));
    }
    const qs = q.toString();
    return fetchApi<BookingResponse[]>(`/bookings${qs ? `?${qs}` : ""}`);
  },
  getProfile: (): Promise<CenterResponse> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        throw new Error("No center found");
      }
      return first;
    }),
  getStats: (): Promise<CenterStats> =>
    fetchApi<AdminStats>("/admin/stats").then((s) => ({
      bookings: { total: s.total_bookings, pending: 0 },
      services: { total: 0, active: 0 },
      revenue: { total_cents: 0 },
    })),
  getServices: (): Promise<ServiceResponse[]> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        return [];
      }
      return servicesApi.listByCenter(first.slug);
    }),
  getStaff: (): Promise<StaffMember[]> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        return [];
      }
      return fetchApi<StaffMember[]>(
        `/centers/${encodeURIComponent(first.slug)}/staff`
      );
    }),
  getCalendar: (): Promise<CalendarEvent[]> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        return [];
      }
      return fetchApi<CalendarEvent[]>(
        `/centers/${encodeURIComponent(first.slug)}/calendar`
      );
    }),
  getKPIs: (): Promise<CenterStats> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        throw new Error("No center found");
      }
      return fetchApi<BackendCenterKpis>(
        `/centers/${encodeURIComponent(first.slug)}/kpis`
      ).then(
        (raw): CenterStats => ({
          bookings: {
            total: raw.total_bookings,
            pending: raw.pending_bookings,
          },
          services: { total: raw.active_services, active: raw.active_services },
          revenue: { total_cents: Math.round(Number(raw.net_revenue) * 100) },
        })
      );
    }),
  getCommissions: (): Promise<CommissionResponse[]> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        return [];
      }
      return fetchApi<CommissionResponse[]>(
        `/commissions?center_id=${first.id}`
      );
    }),
  getPayments: (): Promise<PaymentResponse[]> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        return [];
      }
      return fetchApi<PaymentResponse[]>(`/payments?center_id=${first.id}`);
    }),
  getRevenue: (): Promise<RevenueResponse> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        throw new Error("No center found");
      }
      return fetchApi<RevenueResponse>(`/revenue?center_id=${first.id}`);
    }),
  getBlockedDates: (): Promise<BlockedDateResponse[]> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        return [];
      }
      return fetchApi<BlockedDateResponse[]>(
        `/centers/${encodeURIComponent(first.slug)}/blocked-dates`
      );
    }),
  getHolidays: (): Promise<HolidayResponse[]> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        return [];
      }
      return fetchApi<HolidayResponse[]>(
        `/centers/${encodeURIComponent(first.slug)}/holidays`
      );
    }),
  updateProfile: (body: Partial<CenterResponse>): Promise<CenterResponse> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        throw new Error("No center found");
      }
      return centersApi.update(first.slug, body);
    }),
  createService: (body: CreateServiceRequest): Promise<ServiceResponse> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        throw new Error("No center found");
      }
      return servicesApi.create(first.slug, body);
    }),
  updateService: (
    id: string,
    body: UpdateServiceRequest
  ): Promise<ServiceResponse> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        throw new Error("No center found");
      }
      return servicesApi.update(first.slug, id, body);
    }),
  deleteService: (id: string): Promise<void> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        throw new Error("No center found");
      }
      return servicesApi.remove(first.slug, id);
    }),
  respondToReview: (
    reviewId: string,
    response: string
  ): Promise<ReviewResponse> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        throw new Error("No center found");
      }
      return reviewApi.reply(first.slug, reviewId, response);
    }),
  connectStripe: (
    centerId?: string
  ): Promise<{ url: string; center_id: string }> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        throw new Error("No center found");
      }
      return fetchApi<{ url: string; center_id: string }>("/stripe/connect", {
        method: "POST",
        body: JSON.stringify({ center_id: centerId ?? first.id }),
      });
    }),
  getStripeConfig: (): Promise<StripePayoutConfig> =>
    fetchApi<StripePayoutConfig>("/stripe/config"),
  addStaff: (body: CreateStaffRequest): Promise<{ id: string }> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        throw new Error("No center found");
      }
      return fetchApi<{ id: string }>(
        `/centers/${encodeURIComponent(first.slug)}/staff`,
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );
    }),
  removeStaff: (staffId: string): Promise<void> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        throw new Error("No center found");
      }
      return fetchApi<void>(
        `/centers/${encodeURIComponent(first.slug)}/staff/${staffId}`,
        { method: "DELETE" }
      );
    }),
  updateStaffMember: (
    staffId: string,
    body: UpdateStaffMemberRequest
  ): Promise<{ message: string }> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        throw new Error("No center found");
      }
      return fetchApi<{ message: string }>(
        `/centers/${encodeURIComponent(first.slug)}/staff/${staffId}`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        }
      );
    }),
  getStaffDetail: (staffId: string): Promise<StaffDetailResponse> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        throw new Error("No center found");
      }
      return fetchApi<StaffDetailResponse>(
        `/centers/${encodeURIComponent(first.slug)}/staff/${staffId}`
      );
    }),
  setStaffHours: (staffId: string, hours: WorkingHoursDay[]): Promise<void> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        throw new Error("No center found");
      }
      return fetchApi<void>(
        `/centers/${encodeURIComponent(first.slug)}/staff/${staffId}/hours`,
        {
          method: "PUT",
          body: JSON.stringify({ hours }),
        }
      );
    }),
  getStaffHours: (staffId: string): Promise<WorkingHoursDay[]> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        return [];
      }
      return fetchApi<WorkingHoursDay[]>(
        `/centers/${encodeURIComponent(first.slug)}/staff/${staffId}/hours`
      );
    }),
  getStaffHolidays: (): Promise<HolidayResponse[]> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        return [];
      }
      return centerApi.getHolidays();
    }),
  createHoliday: (body: HolidayRequest): Promise<HolidayResponse> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        throw new Error("No center found");
      }
      return fetchApi<HolidayResponse>(
        `/centers/${encodeURIComponent(first.slug)}/holidays`,
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );
    }),
  deleteHoliday: (holidayId: string): Promise<void> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        throw new Error("No center found");
      }
      return fetchApi<void>(
        `/centers/${encodeURIComponent(first.slug)}/holidays/${holidayId}`,
        { method: "DELETE" }
      );
    }),
  createBlockedDate: (body: {
    blocked_date: string;
    reason?: string;
  }): Promise<BlockedDateResponse> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        throw new Error("No center found");
      }
      return fetchApi<BlockedDateResponse>(
        `/centers/${encodeURIComponent(first.slug)}/blocked-dates`,
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );
    }),
  deleteBlockedDate: (blockedId: string): Promise<void> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        throw new Error("No center found");
      }
      return fetchApi<void>(
        `/centers/${encodeURIComponent(first.slug)}/blocked-dates/${blockedId}`,
        { method: "DELETE" }
      );
    }),
  requestPayout: (
    amount: number,
    currency?: string
  ): Promise<{
    transfer_id: string;
    amount: number;
    currency: string;
    status: string;
  }> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        throw new Error("No center found");
      }
      return fetchApi<{
        transfer_id: string;
        amount: number;
        currency: string;
        status: string;
      }>("/payouts/request", {
        method: "POST",
        body: JSON.stringify({ center_id: first.id, amount, currency }),
      });
    }),
  updateStripeConfig: (body: {
    center_id: string;
    currency?: string;
  }): Promise<{ message: string }> =>
    fetchApi<{ message: string }>("/stripe/config", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  confirmBooking: (bookingId: string): Promise<BookingResponse> =>
    bookingApi.confirm(bookingId),
  cancelBooking: (bookingId: string): Promise<BookingResponse> =>
    bookingApi.cancel(bookingId),
  getBooking: (bookingId: string): Promise<BookingResponse> =>
    bookingApi.getById(bookingId),
  updateStaffBio: (
    staffId: string,
    bio: string
  ): Promise<{ message: string }> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        throw new Error("No center found");
      }
      return fetchApi<{ message: string }>(
        `/centers/${encodeURIComponent(first.slug)}/staff/${staffId}/bio`,
        {
          method: "PATCH",
          body: JSON.stringify({ bio }),
        }
      );
    }),

  // ──────────── Center Members ────────────

  getMembers: (): Promise<CenterMember[]> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        throw new Error("No center found");
      }
      return fetchApi<CenterMember[]>(
        `/centers/${encodeURIComponent(first.slug)}/members`
      );
    }),
  addMember: (body: AddMemberRequest): Promise<CenterMember> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        throw new Error("No center found");
      }
      return fetchApi<CenterMember>(
        `/centers/${encodeURIComponent(first.slug)}/members`,
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );
    }),
  updateMemberRole: (
    memberId: string,
    body: UpdateMemberRoleRequest
  ): Promise<{ message: string }> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        throw new Error("No center found");
      }
      return fetchApi<{ message: string }>(
        `/centers/${encodeURIComponent(first.slug)}/members/${memberId}`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        }
      );
    }),
  removeMember: (memberId: string): Promise<void> =>
    profileApi.getMyCenters().then((centers) => {
      const first = centers[0];
      if (!first) {
        throw new Error("No center found");
      }
      return fetchApi<void>(
        `/centers/${encodeURIComponent(first.slug)}/members/${memberId}`,
        {
          method: "DELETE",
        }
      );
    }),
};

export const couponApi = {
  validate: (
    code: string,
    centerId: string,
    serviceId: string
  ): Promise<CouponValidationResponse> =>
    fetchApi<CouponValidationResponse>(
      `/coupons/validate?code=${encodeURIComponent(code)}&center_id=${encodeURIComponent(centerId)}&service_id=${encodeURIComponent(serviceId)}`
    ),
  claim: (sourceSlug: string): Promise<CouponClaimResponse> =>
    fetchApi<CouponClaimResponse>(
      `/coupons/claim/${encodeURIComponent(sourceSlug)}`,
      { method: "POST" }
    ),
  mine: (): Promise<CouponResponse[]> =>
    fetchApi<CouponResponse[]>("/coupons/mine"),
  getActiveSources: (): Promise<CouponSourceResponse[]> =>
    fetchApi<CouponSourceResponse[]>("/coupons/sources", { skipAuth: true }),
};
