import 'server-only';

import { getLocale } from './get-locale-server';
import { getMessages, getNestedValue } from './get-messages';
import type { Locale } from './config';

type TranslationValues = Record<string, string | number>;

function requireString(messages: Record<string, unknown>, path: string): string {
  const value = getNestedValue(messages, path);
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing i18n string: ${path}`);
  }
  return value;
}

function interpolate(template: string, values?: TranslationValues): string {
  if (!values) return template;
  let out = template;
  for (const [k, v] of Object.entries(values)) {
    out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return out;
}

export async function getTranslationsServer(namespace?: string): Promise<{
  locale: Locale;
  messages: Record<string, unknown>;
  t: (key: string, values?: TranslationValues) => string;
}> {
  const locale = await getLocale();
  const messages = await getMessages(locale);

  const t = (key: string, values?: TranslationValues) => {
    const fullPath = namespace ? `${namespace}.${key}` : key;
    const template = requireString(messages, fullPath);
    return interpolate(template, values);
  };

  return { locale, messages, t };
}
