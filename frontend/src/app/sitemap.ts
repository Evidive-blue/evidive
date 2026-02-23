import type { MetadataRoute } from "next";
import { getApiUrl, getBaseUrl } from "@/lib/site-config";

const staticRoutes = [
  "",
  "/about",
  "/centers",
  "/blog",
  "/faq",
  "/contact",
  "/careers",
  "/login",
  "/register",
  "/terms",
  "/privacy",
  "/sitemap",
  "/onboard/center",
] as const;

interface CenterSlug {
  slug: string;
}

async function fetchCenterSlugs(): Promise<CenterSlug[]> {
  try {
    const res = await fetch(`${getApiUrl()}/api/v1/centers?limit=1000`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return [];
    }

    const json: unknown = await res.json();
    const data = (json as { data?: unknown }).data;

    if (!Array.isArray(data)) {
      return [];
    }

    return data.filter(
      (item): item is CenterSlug =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as CenterSlug).slug === "string"
    );
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: new URL(path || "/", baseUrl).toString(),
    lastModified,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.8,
  }));

  const centers = await fetchCenterSlugs();

  const centerEntries: MetadataRoute.Sitemap = centers.map((center) => ({
    url: new URL(`/centers/${center.slug}`, baseUrl).toString(),
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticEntries, ...centerEntries];
}
