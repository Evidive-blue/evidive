import {
  HeroSection,
  FeaturesSection,
  WorldExplorerSection,
  DestinationsSection,
  CTASection,
} from "@/components/home";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { locales } from "@/i18n/config";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Generate hreflang alternates for all European languages
const generateAlternates = (path: string = "") => {
  const languages: Record<string, string> = {};
  locales.forEach((locale) => {
    languages[locale] = `${baseUrl}/${locale}${path}`;
  });
  return languages;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    metadataBase: new URL(baseUrl),
    title: t("home.title"),
    description: t("home.description"),
    keywords: [
      "plongée", "diving", "scuba", "tauchen", "buceo", "immersione",
      "réservation plongée", "dive booking", "dive center", "centre de plongée",
      "snorkeling", "PADI", "SSI", "CMAS"
    ],
    openGraph: {
      type: "website",
      url: `${baseUrl}/${locale}`,
      siteName: "EviDive",
      title: t("home.title"),
      description: t("home.description"),
      locale: locale === "fr" ? "fr_FR" : locale === "de" ? "de_DE" : locale === "es" ? "es_ES" : locale === "it" ? "it_IT" : locale === "pt" ? "pt_PT" : "en_GB",
      images: [
        {
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: "EviDive - Explore the ocean depths",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("home.title"),
      description: t("home.description"),
      images: [`${baseUrl}/og-image.png`],
    },
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: generateAlternates(),
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      {/* Hero with search */}
      <HeroSection />

      {/* How it works */}
      <FeaturesSection />

      {/* Explore the world */}
      <WorldExplorerSection />

      {/* Popular destinations */}
      <DestinationsSection />

      {/* CTA for dive centers */}
      <CTASection locale={locale} />
    </>
  );
}
