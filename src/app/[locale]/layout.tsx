import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import { locales, type Locale } from "@/i18n/config";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { OceanCanvas } from "@/components/effects/ocean-canvas";
import { FloatingParticles } from "@/components/effects/floating-particles";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Providers } from "@/components/providers";
import { OnboardDrawer } from "@/components/onboard/onboard-drawer";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen font-sans antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>
            {/* Toast notifications */}
            <Toaster richColors position="top-right" />
            
            {/* Ocean Canvas - Single giant background */}
            <OceanCanvas />
            
            {/* Floating particles for ambient life */}
            <FloatingParticles count={25} variant="mixed" />

            {/* Navigation */}
            <Navbar locale={locale as Locale} />
            <OnboardDrawer />

            {/* Main Content with smooth transitions */}
            <main className="relative">
              <PageWrapper>{children}</PageWrapper>
            </main>

            {/* Footer */}
            <Footer locale={locale as Locale} />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
