// i18n Configuration - SANS préfixes URL
//
// IMPORTANT:
// On ne doit exposer que des langues réellement maintenues.
// Les autres fichiers `messages/*.json` existent possiblement mais ne sont pas prêts (clés manquantes / structure divergente).
export const locales = ['fr', 'en'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fr';

export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
};

export const localeFlags: Record<Locale, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
};

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}
