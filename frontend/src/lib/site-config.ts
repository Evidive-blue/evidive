/**
 * Site-wide configuration constants.
 * Single source of truth for URLs, social links, and branding.
 *
 * IMPORTANT: No domain should be hardcoded elsewhere in the codebase.
 * Always import from this module.
 */

// ---------------------------------------------------------------------------
// Base URL
// ---------------------------------------------------------------------------

/**
 * Returns the public base URL of the frontend.
 * Uses `NEXT_PUBLIC_BASE_URL` environment variable.
 * In development, falls back to localhost.
 */
export function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_BASE_URL;
  if (url) return url;
  return process.env.NODE_ENV === "production"
    ? process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : ""
    : "http://localhost:3000";
}

// ---------------------------------------------------------------------------
// Social links
// ---------------------------------------------------------------------------

export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/evidive_officiel/",
  facebook: "https://www.facebook.com/evidive.officiel",
  linkedin: "https://www.linkedin.com/company/evidive",
} as const;

// ---------------------------------------------------------------------------
// API URL
// ---------------------------------------------------------------------------

export function getApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (url) return url;
  return "http://localhost:8080";
}
