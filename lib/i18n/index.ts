// i18n exports (client-safe)
export * from './config';
export { getLocaleClient, setLocale, LOCALE_COOKIE } from './get-locale';
export { getMessages, getNestedValue } from './get-messages';
export { useTranslations } from './use-translations';
export { LocaleProvider, useLocale } from './locale-provider';

// Server-only exports must be imported directly from './get-locale-server'
// import { getLocale } from '@/lib/i18n/get-locale-server';
