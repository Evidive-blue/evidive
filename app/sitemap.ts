import { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { locales } from '@/lib/i18n/config';
import { prisma } from '@/lib/db/prisma';

// Force dynamic rendering to use request headers for base URL
export const dynamic = 'force-dynamic';

async function getBaseUrl() {
  // Priority: explicit config > headers > Vercel URL > fallback
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl;

  // Use headers to get the current host (forces dynamic rendering)
  const headerList = await headers();
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host');
  if (host) {
    const protocol = headerList.get('x-forwarded-proto') ?? 'https';
    return `${protocol}://${host}`;
  }

  // Vercel URL fallback (deployment-specific URL)
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  // Fallback for local development
  return 'http://localhost:3000';
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = await getBaseUrl();

  // Static pages that should be indexed
  const staticPages = [
    '',
    '/about',
    '/careers',
    '/centers',
    '/contact',
    '/explorer',
    '/login',
    '/register',
    '/privacy',
    '/terms',
  ];

  // Generate entries for all static pages with all locales
  const staticEntries: MetadataRoute.Sitemap = staticPages.flatMap((page) => {
    const languages: Record<string, string> = {};
    
    // Add hreflang entries for all locales
    locales.forEach((locale) => {
      languages[locale] = `${baseUrl}/${locale}${page}`;
    });

    return {
      url: `${baseUrl}${page}`,
      lastModified: new Date(),
      changeFrequency: page === '' ? 'daily' : 'weekly',
      priority: page === '' ? 1 : 0.8,
      alternates: {
        languages,
      },
    };
  });

  let centerEntries: MetadataRoute.Sitemap = [];

  try {
    const centers = await prisma.center.findMany({
      where: { status: 'APPROVED' },
      select: { slug: true, updatedAt: true },
    });

    centerEntries = centers.map((center) => {
      const languages: Record<string, string> = {};
      locales.forEach((locale) => {
        languages[locale] = `${baseUrl}/${locale}/centers/${center.slug}`;
      });

      return {
        url: `${baseUrl}/centers/${center.slug}`,
        lastModified: center.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
        alternates: {
          languages,
        },
      };
    });
  } catch {
    return staticEntries;
  }

  return [...staticEntries, ...centerEntries];
}
