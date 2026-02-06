// i18n Configuration - SANS préfixes URL
export const locales = ['fr', 'en', 'de', 'es', 'it', 'pt', 'nl', 'pl', 'el', 'ru', 'sv'] as const;

// Alias for compatibility
export const supportedLocales = locales;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fr';

export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  it: 'Italiano',
  pt: 'Português',
  nl: 'Nederlands',
  pl: 'Polski',
  el: 'Ελληνικά',
  ru: 'Русский',
  sv: 'Svenska',
};

export const localeFlags: Record<Locale, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
  de: '🇩🇪',
  es: '🇪🇸',
  it: '🇮🇹',
  pt: '🇵🇹',
  nl: '🇳🇱',
  pl: '🇵🇱',
  el: '🇬🇷',
  ru: '🇷🇺',
  sv: '🇸🇪',
};

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

// OpenGraph locale mapping for all 11 languages
export const localeToOpenGraph: Record<Locale, string> = {
  fr: 'fr_FR',
  en: 'en_US',
  de: 'de_DE',
  es: 'es_ES',
  it: 'it_IT',
  pt: 'pt_PT',
  nl: 'nl_NL',
  pl: 'pl_PL',
  el: 'el_GR',
  ru: 'ru_RU',
  sv: 'sv_SE',
};

export function getOpenGraphLocale(locale: Locale): string {
  return localeToOpenGraph[locale] || 'en_US';
}
