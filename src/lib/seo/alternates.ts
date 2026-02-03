/**
 * SEO Helpers for Multilingual Alternates
 * Generates canonical URLs and language alternates for all 11 European locales
 */

import { locales, type Locale } from "@/i18n/config";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://evidive.blue";

/**
 * Generate alternates for SEO metadata
 * @param path - The path after locale (e.g., "/contact", "/about")
 * @param currentLocale - Optional current locale for canonical URL
 * @returns Alternates object for Next.js Metadata
 */
export function generateAlternates(path: string = "", currentLocale?: Locale) {
  const languages: Record<string, string> = {};
  
  locales.forEach((locale) => {
    languages[locale] = `${baseUrl}/${locale}${path}`;
  });

  return {
    canonical: currentLocale 
      ? `${baseUrl}/${currentLocale}${path}` 
      : `${baseUrl}${path}`,
    languages,
  };
}

/**
 * Get OpenGraph locale format
 * @param locale - The locale code (e.g., "fr", "en", "de")
 * @returns OpenGraph locale format (e.g., "fr_FR", "en_GB")
 */
export function getOgLocale(locale: string): string {
  const localeMap: Record<string, string> = {
    fr: "fr_FR",
    en: "en_GB",
    de: "de_DE",
    es: "es_ES",
    it: "it_IT",
    pt: "pt_PT",
    nl: "nl_NL",
    pl: "pl_PL",
    sv: "sv_SE",
    el: "el_GR",
    ru: "ru_RU",
  };
  return localeMap[locale] || "en_GB";
}

/**
 * Get all OpenGraph locale alternates
 * @returns Array of OG locale codes excluding the current one
 */
export function getOgLocaleAlternates(currentLocale: string): string[] {
  return locales
    .filter((locale) => locale !== currentLocale)
    .map((locale) => getOgLocale(locale));
}

/**
 * Generate full metadata alternates including x-default
 * @param path - The path after locale
 * @param currentLocale - Current page locale
 * @returns Complete alternates with x-default
 */
export function generateFullAlternates(path: string, currentLocale: Locale) {
  const alternates = generateAlternates(path, currentLocale);
  
  return {
    ...alternates,
    languages: {
      ...alternates.languages,
      "x-default": `${baseUrl}/fr${path}`, // French as default
    },
  };
}

/**
 * Base URL getter
 */
export function getBaseUrl(): string {
  return baseUrl;
}
