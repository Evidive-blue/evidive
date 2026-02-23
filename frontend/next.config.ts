import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "radix-ui",
      "class-variance-authority",
    ],
  },
  async headers() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
    const connectSrc = ["'self'", apiUrl, "https://*.supabase.co", "wss://*.supabase.co"]
      .filter(Boolean)
      .join(" ");

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://images.unsplash.com https://*.amazonaws.com https://*.cloudfront.net https://files.stripe.com",
              "font-src 'self' data:",
              `connect-src ${connectSrc}`,
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? [{ protocol: "https" as const, hostname: process.env.VERCEL_PROJECT_PRODUCTION_URL }]
        : []),
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // Allow Stripe hosted images (for center logos uploaded via Stripe Connect)
        protocol: "https",
        hostname: "files.stripe.com",
      },
      {
        // Allow common image CDNs (S3, Cloudfront, etc.)
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "**.cloudfront.net",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
