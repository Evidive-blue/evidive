import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL;

export async function generateMetadata({
 params,
}: {
 params: Promise<{ locale: string }>;
}): Promise<Metadata> {
 const { locale } = await params;
 const t = await getTranslations({ locale, namespace: "metadata.verifyEmail" });

 return {
  title: t("title"),
  description: t("description"),
  metadataBase: new URL(baseUrl!),
  openGraph: {
   title: t("title"),
   description: t("description"),
   type: "website",
   locale: locale === "fr" ? "fr_FR" : locale === "de" ? "de_DE" : "en_US",
   url: `${baseUrl}/${locale}/verify-email`,
   siteName: "EviDive",
  },
  twitter: {
   card: "summary_large_image",
   title: t("title"),
   description: t("description"),
   images: [`${baseUrl}/og-verify-email.png`],
  },
  alternates: {
   canonical: `${baseUrl}/${locale}/verify-email`,
   languages: {
    fr: `${baseUrl}/fr/verify-email`,
    en: `${baseUrl}/en/verify-email`,
    de: `${baseUrl}/de/verify-email`,
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