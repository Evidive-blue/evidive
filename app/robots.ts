import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

async function getBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (envUrl) return envUrl;

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  const headerList = await headers();
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host');
  const protocol = headerList.get('x-forwarded-proto') ?? 'https';

  if (!host) {
    throw new Error('Missing host for robots base URL.');
  }

  return `${protocol}://${host}`;
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
