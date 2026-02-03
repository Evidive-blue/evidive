'use client';

import { useCallback, useMemo } from 'react';
import { useLocale } from './locale-provider';
import { getNestedValue } from './get-messages';

type TranslationValues = Record<string, string | number>;

/**
 * Hook for translations in client components
 * Usage: const t = useTranslations('hero');
 *        t('title') -> messages.hero.title
 */
export function useTranslations(namespace?: string) {
  const { messages } = useLocale();

  const t = useCallback(
    (key: string, values?: TranslationValues): string => {
      const fullPath = namespace ? `${namespace}.${key}` : key;
      let translation = getNestedValue(messages, fullPath);

      // If not a string, return the key
      if (typeof translation !== 'string') {
        return key;
      }

      // Interpolate values
      if (values) {
        Object.entries(values).forEach(([k, v]) => {
          translation = (translation as string).replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        });
      }

      return translation as string;
    },
    [messages, namespace]
  );

  return t;
}

/**
 * Alias pour compatibilité
 */
export const useT = useTranslations;
