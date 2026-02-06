import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

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

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  return 'http://localhost:3000';
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = await getBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/onboard/',
          '/center/manage/',
          '/forgot-password',
          '/reset-password',
          '/verify-email',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
