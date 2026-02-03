// Langues européennes complètes
export const locales = [
  "fr", // Français (France, Belgique, Suisse)
  "en", // English (UK, Ireland)
  "de", // Deutsch (Germany, Austria, Switzerland)
  "es", // Español (Spain)
  "it", // Italiano (Italy)
  "pt", // Português (Portugal)
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "fr";

export const localeNames: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
  pt: "Português",
};

// ISO 3166-1 country codes for each locale (for flags, etc.)
export const localeCountries: Record<Locale, string> = {
  fr: "FR",
  en: "GB",
  de: "DE",
  es: "ES",
  it: "IT",
  pt: "PT",
};

// RTL languages (none for European languages)
export const rtlLocales: Locale[] = [];
