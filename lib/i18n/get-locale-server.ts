import 'server-only';
import { cookies, headers } from 'next/headers';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { locales, defaultLocale, type Locale, isValidLocale } from './config';

export const LOCALE_COOKIE = 'NEXT_LOCALE';

/**
 * Get locale from cookie, Accept-Language header, or default
 * SERVER ONLY - works via cookies/headers
 */
export async function getLocale(): Promise<Locale> {
  // 1. Check cookie first
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  
  if (cookieLocale && isValidLocale(cookieLocale)) {
    return cookieLocale;
  }

  // 2. Try Accept-Language header
  const headerStore = await headers();
  const acceptLanguage = headerStore.get('accept-language');
  
  if (acceptLanguage) {
    try {
      const negotiator = new Negotiator({
        headers: { 'accept-language': acceptLanguage },
      });
      const languages = negotiator.languages();
      const matched = match(languages, [...locales], defaultLocale) as Locale;
      return matched;
    } catch {
      // Fallback to default
    }
  }

  // 3. Default locale
  return defaultLocale;
}
