import { MetadataRoute } from 'next';
import { locales } from '@/lib/i18n/config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://evidive.blue';

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

  // TODO: Fetch dynamic dive center slugs from database
  // This is a placeholder - in production, query your database for all center slugs
  let centerEntries: MetadataRoute.Sitemap = [];
  
  try {
    // Example: const centers = await prisma.diveCenter.findMany({ select: { slug: true } });
    // For now, we'll leave this as a placeholder that can be populated later
    const centerSlugs: string[] = []; // Replace with actual DB query
    
    centerEntries = centerSlugs.map((slug) => {
      const languages: Record<string, string> = {};
      locales.forEach((locale) => {
        languages[locale] = `${baseUrl}/${locale}/centers/${slug}`;
      });

      return {
        url: `${baseUrl}/centers/${slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
        alternates: {
          languages,
        },
      };
    });
  } catch (error) {
    console.error('Error fetching center slugs for sitemap:', error);
  }

  return [...staticEntries, ...centerEntries];
}
