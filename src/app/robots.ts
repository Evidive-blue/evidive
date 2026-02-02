import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL;

if (!baseUrl) {
  throw new Error("NEXT_PUBLIC_BASE_URL (or NEXT_PUBLIC_SITE_URL) is required for robots");
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/_next/", "/onboard/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}