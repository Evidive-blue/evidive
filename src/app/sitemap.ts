import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Pages statiques principales
  const staticRoutes = [
    "",
    "/about",
    "/contact",
    "/explorer",
    "/centers",
    "/careers",
    "/onboard"
  ];

  const staticPages = staticRoutes.flatMap((route) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: route === "" ? ("weekly" as const) : ("monthly" as const),
      priority: route === "" ? 1.0 : route === "/about" || route === "/contact" ? 0.8 : 0.6,
    }))
  );

  // Pages dynamiques (centres - exemple)
  // TODO: Remplacer par la vraie fonction de fetch des centres
  const centers: { slug: string }[] = [
    // Exemple: { slug: "center-1" }, { slug: "center-2" }
  ];

  const centerPages = centers.flatMap((center) =>
    locales.map((locale) => ({
      url: `${baseUrl}/${locale}/center/${center.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))
  );

  return [...staticPages, ...centerPages];
}