import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Geist, Geist_Mono } from 'next/font/google';
import { getLocale } from '@/lib/i18n/get-locale-server';
import { getMessages } from '@/lib/i18n/get-messages';
import { getNestedValue } from '@/lib/i18n/get-messages';
import { LocaleProvider } from '@/lib/i18n/locale-provider';
import { getOpenGraphLocale } from '@/lib/i18n/config';
import { AuthProvider } from '@/components/providers/auth-provider';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { ZenModeOverlay, ZenFab } from '@/components/zen';
import { OceanCanvasWrapper } from '@/components/effects/ocean-canvas-wrapper';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

function requireString(messages: Record<string, unknown>, path: string): string {
  const value = getNestedValue(messages, path);
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing i18n string: ${path}`);
  }
  return value;
}

async function getBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_BASE_URL;
  if (envUrl) return envUrl;

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  const headerList = await headers();
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host');
  const protocol = headerList.get('x-forwarded-proto') ?? 'https';

  if (!host) {
    throw new Error('Missing host for metadata base URL.');
  }

  return `${protocol}://${host}`;
}


export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = await getMessages(locale);

  const brandName = requireString(messages, 'footer.brandName');
  const titleDefault = requireString(messages, 'metadata.home.title');
  const description = requireString(messages, 'metadata.home.description');
  const ogImageAlt = requireString(messages, 'imageAlt.ogImage');

  const keywords = getNestedValue(messages, 'metadata.home.keywords');
  const keywordsArray =
    Array.isArray(keywords) && keywords.every((k) => typeof k === 'string')
      ? (keywords as string[])
      : undefined;

  const baseUrl = await getBaseUrl();

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: titleDefault,
      template: `%s | ${brandName}`,
    },
    description,
    keywords: keywordsArray,
    authors: [{ name: brandName, url: baseUrl }],
    creator: brandName,
    openGraph: {
      type: 'website',
      locale: getOpenGraphLocale(locale),
      url: baseUrl,
      siteName: brandName,
      title: titleDefault,
      description,
      images: [
        {
          url: '/evidive-logo.png',
          alt: ogImageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: titleDefault,
      description,
      images: ['/evidive-logo.png'],
    },
    robots: {
      index: true,
      follow: true,
    },
    icons: {
      icon: [
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/evidive-logo.png', type: 'image/png' },
      ],
      apple: '/evidive-logo.png',
    },
    manifest: '/site.webmanifest',
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages(locale);

  return (
    <html lang={locale} className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <LocaleProvider initialLocale={locale} initialMessages={messages}>
            {/* Ocean Background Animation */}
            <OceanCanvasWrapper />
            
            {/* Zen Mode Overlay */}
            <ZenModeOverlay />
            
            {/* Zen Mode Floating Button */}
            <ZenFab />
            
            <div className="relative min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </LocaleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
