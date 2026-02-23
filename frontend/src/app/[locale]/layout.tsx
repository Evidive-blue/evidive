import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { Geist, Geist_Mono } from "next/font/google";
import { OceanBackground } from "@/components/ocean-background";
import { Navbar, Footer, FooterReveal } from "@/components/layout";
import { EasterEggProvider } from "@/components/easter-egg/easter-egg-provider";
import { MotionProvider } from "@/components/motion-provider";
import { ReducedEffectsProvider } from "@/components/reduced-effects-provider";
import { getBaseUrl, getApiUrl } from "@/lib/site-config";
import "../globals.css";

/* ── Non-critical components: separate JS chunks, loaded after initial paint ── */
const ChatFab = dynamic(() =>
  import("@/components/chat-fab/chat-fab").then((m) => ({
    default: m.ChatFab,
  }))
);
const ZenFab = dynamic(() =>
  import("@/components/zen-fab/zen-fab").then((m) => ({
    default: m.ZenFab,
  }))
);
const ScrollToTop = dynamic(() =>
  import("@/components/scroll-to-top/scroll-to-top").then((m) => ({
    default: m.ScrollToTop,
  }))
);
const WelcomePopup = dynamic(() =>
  import("@/components/welcome-popup").then((m) => ({
    default: m.WelcomePopup,
  }))
);

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

type LayoutParams = {
  locale: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<LayoutParams>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "hero" });

  const title = t("seoTitle");
  const description = t("subtitle");

  const base = getBaseUrl();

  return {
    metadataBase: new URL(base),
    title: {
      default: title,
      template: "%s | EviDive",
    },
    description,
    icons: {
      icon: "/evidive-logo.png",
      apple: "/evidive-logo.png",
    },
    openGraph: {
      type: "website",
      url: base,
      siteName: "EviDive",
      title,
      description,
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<LayoutParams>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale}>
      <head>
        {/* Early connection to API — saves TLS handshake time on first fetch */}
        <link rel="preconnect" href={getApiUrl()} />
        <link rel="dns-prefetch" href={getApiUrl()} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <OceanBackground />
        {/* next-intl v4: messages inherited automatically from i18n/request.ts */}
        <NextIntlClientProvider>
          <ReducedEffectsProvider>
            <MotionProvider>
              <EasterEggProvider>
                <div className="relative flex min-h-screen flex-col">
                  <Navbar />
                  <main className="flex-1 overflow-x-clip pb-20 pt-20 sm:pt-24 md:pb-0 md:pt-20">
                    {children}
                  </main>
                  <FooterReveal>
                    <Footer />
                  </FooterReveal>
                  <ZenFab />
                  <ScrollToTop />
                  <ChatFab />
                  <WelcomePopup />
                </div>
              </EasterEggProvider>
            </MotionProvider>
          </ReducedEffectsProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
