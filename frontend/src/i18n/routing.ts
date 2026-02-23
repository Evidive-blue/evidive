import { defineRouting } from "next-intl/routing";

// Langues européennes principales
const europeanLocales = [
  "en", // Anglais (par défaut)
  "fr", // Français
  "de", // Allemand
  "es", // Espagnol
  "it", // Italien
  "pt", // Portugais
  "nl", // Néerlandais
  "pl", // Polonais
  "cs", // Tchèque
  "sv", // Suédois
  "da", // Danois
  "fi", // Finnois
  "hu", // Hongrois
  "ro", // Roumain
  "el", // Grec
  "sk", // Slovaque
  "bg", // Bulgare
  "hr", // Croate
  "lt", // Lituanien
  "lv", // Letton
  "et", // Estonien
  "si", // Slovène
  "mt", // Maltais
  "ga", // Irlandais
] as const;

// Langues importantes (non-européennes)
const importantLocales = [
  "ar", // Arabe
  "zh", // Chinois
  "ja", // Japonais
  "ko", // Coréen
  "hi", // Hindi
  "ru", // Russe
  "tr", // Turc
  "vi", // Vietnamien
  "th", // Thaïlandais
] as const;

export const locales = [
  ...europeanLocales,
  ...importantLocales,
] as const;

export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localePrefix: "never", // Pas de préfixe dans l'URL, détection par cookie/headers
});
