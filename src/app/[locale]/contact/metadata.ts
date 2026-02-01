import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL;

export async function generateMetadata({
 params,
}: {
 params: Promise<{ locale: string }>;
}): Promise<Metadata> {
 const { locale } = await params;
 const t = await getTranslations({ locale, namespace: "contact.meta" });

 return {
  title: t("title"),
  description: t("description"),
  metadataBase: new URL(baseUrl!),
  openGraph: {
   title: t("title"),
   description: t("description"),
   type: "website",
   locale: locale === "fr" ? "fr_FR" : locale === "de" ? "de_DE" : "en_US",
   url: `${baseUrl}/${locale}/contact`,
   siteName: "EviDive",
  },
  twitter: {
   card: "summary_large_image",
   title: t("title"),
   description: t("description"),
   images: [`${baseUrl}/og-contact.png`],
  },
  alternates: {
   canonical: `${baseUrl}/${locale}/contact`,
   languages: {
    fr: `${baseUrl}/fr/contact`,
    en: `${baseUrl}/en/contact`,
    de: `${baseUrl}/de/contact`,
   },
  },
  robots: {
   index: true,
   follow: true,
   googleBot: {
    index: true,
    follow: true,
    "max-video-preview": -1,
    "max-image-preview": "large",
    "max-snippet": -1,
   },
  },
 };
}