import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata({
 params,
}: {
 params: Promise<{ locale: string }>;
}): Promise<Metadata> {
 const { locale } = await params;
 const t = await getTranslations({ locale, namespace: "metadata.resetPassword" });

 return {
  title: t("title"),
  description: t("description"),
  metadataBase: new URL(baseUrl!),
  openGraph: {
   title: t("title"),
   description: t("description"),
   type: "website",
   locale: locale === "fr" ? "fr_FR" : locale === "de" ? "de_DE" : "en_US",
   url: `${baseUrl}/${locale}/reset-password`,
   siteName: "EviDive",
  },
  twitter: {
   card: "summary_large_image",
   title: t("title"),
   description: t("description"),
   images: [`${baseUrl}/og-reset-password.png`],
  },
  alternates: {
   canonical: `${baseUrl}/${locale}/reset-password`,
   languages: {
    fr: `${baseUrl}/fr/reset-password`,
    en: `${baseUrl}/en/reset-password`,
    de: `${baseUrl}/de/reset-password`,
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