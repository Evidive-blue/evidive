// Langues européennes complètes
export const locales = [
  "fr", // Français (France, Belgique, Suisse)
  "en", // English (UK, Ireland)
  "de", // Deutsch (Germany, Austria, Switzerland)
  "es", // Español (Spain)
  "it", // Italiano (Italy)
  "pt", // Português (Portugal)
  "nl", // Nederlands (Netherlands, Belgium)
  "pl", // Polski (Poland)
  "sv", // Svenska (Sweden)
  "el", // Ελληνικά (Greece, Cyprus)
  "ru", // Русский (Russia, Eastern Europe)
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
  nl: "Nederlands",
  pl: "Polski",
  sv: "Svenska",
  el: "Ελληνικά",
  ru: "Русский",
};

// ISO 3166-1 country codes for each locale (for flags, etc.)
export const localeCountries: Record<Locale, string> = {
  fr: "FR",
  en: "GB",
  de: "DE",
  es: "ES",
  it: "IT",
  pt: "PT",
  nl: "NL",
  pl: "PL",
  sv: "SE",
  el: "GR",
  ru: "RU",
};

// RTL languages (none for European languages)
export const rtlLocales: Locale[] = [];
