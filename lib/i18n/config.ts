// i18n Configuration - SANS préfixes URL
export const locales = ['fr', 'en', 'de', 'es', 'it', 'pt', 'nl', 'pl', 'el', 'ru', 'sv'] as const;

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
