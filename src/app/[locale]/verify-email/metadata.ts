import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { locales } from "@/i18n/config";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const generateAlternates = (path: string) => {
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
 const t = await getTranslations({ locale, namespace: "metadata.verifyEmail" });

 return {
  title: t("title"),
  description: t("description"),
  metadataBase: new URL(baseUrl),
  openGraph: {
   title: t("title"),
   description: t("description"),
   type: "website",
   locale: locale === "fr" ? "fr_FR" : locale === "de" ? "de_DE" : locale === "es" ? "es_ES" : locale === "it" ? "it_IT" : "en_GB",
   url: `${baseUrl}/${locale}/verify-email`,
   siteName: "EviDive",
  },
  twitter: {
   card: "summary_large_image",
   title: t("title"),
   description: t("description"),
  },
  alternates: {
   canonical: `${baseUrl}/${locale}/verify-email`,
   languages: generateAlternates("/verify-email"),
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
