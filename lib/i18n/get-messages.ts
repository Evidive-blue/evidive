import type { Locale } from './config';

// Cache des messages chargés
const messagesCache = new Map<Locale, Record<string, unknown>>();

/**
 * Charge les messages de traduction pour une locale
 */
export async function getMessages(locale: Locale): Promise<Record<string, unknown>> {
  // Check cache
  if (messagesCache.has(locale)) {
    return messagesCache.get(locale)!;
  }

  try {
    // Dynamic import des messages
    const messages = (await import(`@/messages/${locale}.json`)).default;
    messagesCache.set(locale, messages);
    return messages;
  } catch {
    // Fallback to French if locale not found
    if (locale !== 'fr') {
      const frMessages = (await import('@/messages/fr.json')).default;
      messagesCache.set('fr', frMessages);
      return frMessages;
    }
    return {};
  }
}

/**
 * Get a nested translation value
 */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path; // Return path as fallback
    }
  }

  return current;
}
