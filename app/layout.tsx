import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { getLocale } from '@/lib/i18n/get-locale-server';
import { getMessages } from '@/lib/i18n/get-messages';
import { getNestedValue } from '@/lib/i18n/get-messages';
import { LocaleProvider } from '@/lib/i18n/locale-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { OceanCanvas } from '@/components/effects/ocean-canvas';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

function requireString(messages: Record<string, unknown>, path: string): string {
  const value = getNestedValue(messages, path);
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing i18n string: ${path}`);
  }
  return value;
}

function getOpenGraphLocale(locale: string): string {
  // Open Graph expects locales like fr_FR, en_US, etc.
  // Keep this mapping config-only (not a translation concern).
  switch (locale) {
    case 'fr':
      return 'fr_FR';
    case 'en':
      return 'en_US';
    default:
      return 'fr_FR';
  }
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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://evidive.blue';

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
          url: '/og-image.jpg',
          width: 1200,
          height: 630,
          alt: ogImageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: titleDefault,
      description,
      images: ['/og-image.jpg'],
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
            <OceanCanvas />
            
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
