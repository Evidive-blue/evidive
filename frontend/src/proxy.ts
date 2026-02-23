import createMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware({
  ...routing,
  localeDetection: true,
});

function buildCsp(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
  const connectSrc = ["'self'", apiUrl, "https://*.supabase.co", "wss://*.supabase.co"]
    .filter(Boolean)
    .join(" ");

  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://images.unsplash.com https://*.amazonaws.com https://*.cloudfront.net https://files.stripe.com",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

/**
 * Proxy that handles:
 * 1. Internationalization (next-intl)
 * 2. Route protection for /admin/* and /dashboard/*
 * 3. Security headers (CSP)
 */
export default function proxy(request: NextRequest) {
  const response = intlMiddleware(request);

  response.headers.set("Content-Security-Policy", buildCsp());
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return response;
}

export const config = {
  // Match toutes les routes sauf les fichiers statiques et API
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
