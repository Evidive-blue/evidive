import {
  HeroSection,
  FeaturesSection,
  WorldExplorerSection,
  DestinationsSection,
  CTASection,
} from "@/components/home";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    metadataBase: new URL(baseUrl!),
    title: t("home.title"),
    description: t("home.description"),
    openGraph: {
      type: "website",
      url: baseUrl,
      title: t("home.title"),
      description: t("home.description"),
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
      canonical: baseUrl,
      languages: {
        fr: `${baseUrl}/fr`,
        en: `${baseUrl}/en`,
        de: `${baseUrl}/de`,
      },
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
