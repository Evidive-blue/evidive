import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata.forgotPassword" });

  return {
    title: t("title"),
    description: t("description"),
    metadataBase: new URL(baseUrl!),
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
      locale: locale === "fr" ? "fr_FR" : locale === "de" ? "de_DE" : "en_US",
      url: `${baseUrl}/${locale}/forgot-password`,
      siteName: "EviDive",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
    alternates: {
      canonical: `${baseUrl}/${locale}/forgot-password`,
      languages: {
        fr: `${baseUrl}/fr/forgot-password`,
        en: `${baseUrl}/en/forgot-password`,
        de: `${baseUrl}/de/forgot-password`,
      },
    },
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}
