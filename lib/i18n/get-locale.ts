import { type Locale, defaultLocale, isValidLocale } from './config';

export const LOCALE_COOKIE = 'NEXT_LOCALE';

/**
 * Get locale synchronously (for client components)
 * Uses document.cookie
 */
export function getLocaleClient(): Locale {
  if (typeof document === 'undefined') {
    return defaultLocale;
  }

  const cookieMatch = document.cookie.match(new RegExp(`${LOCALE_COOKIE}=([^;]+)`));
  const locale = cookieMatch?.[1];

  if (locale && isValidLocale(locale)) {
    return locale;
  }

  return defaultLocale;
}

/**
 * Set locale in cookie
 */
export function setLocale(locale: Locale): void {
  if (typeof document !== 'undefined') {
    document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;samesite=lax`;
  }
}
