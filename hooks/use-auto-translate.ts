'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { Locale } from '@/lib/i18n/config';

export type TranslationResult = {
  success: boolean;
  translations: Record<Locale, string>;
  errors?: string[];
};

interface UseAutoTranslateOptions {
  onSuccess?: (translations: Record<Locale, string>) => void;
  onError?: (error: string) => void;
}

export function useAutoTranslate(options: UseAutoTranslateOptions = {}) {
  const [isTranslating, setIsTranslating] = useState(false);

  /**
   * Traduit un texte vers toutes les langues
   */
  const translate = useCallback(async (
    text: string,
    sourceLocale: Locale = 'fr'
  ): Promise<TranslationResult | null> => {
    if (!text.trim()) {
      toast.error('Aucun texte à traduire');
      return null;
    }

    setIsTranslating(true);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'translate',
          text,
          sourceLocale,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur de traduction');
      }

      const result: TranslationResult = await response.json();

      if (result.success) {
        toast.success('Traduction effectuée avec succès');
        options.onSuccess?.(result.translations);
      } else if (result.errors?.length) {
        toast.warning(`Traduction partielle: ${result.errors.join(', ')}`);
        options.onSuccess?.(result.translations);
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de traduction';
      toast.error(message);
      options.onError?.(message);
      return null;
    } finally {
      setIsTranslating(false);
    }
  }, [options]);

  /**
   * Traduit les langues manquantes d'un objet multilingue existant
   */
  const translateMissing = useCallback(async (
    content: Record<string, string>,
    sourceLocale?: Locale
  ): Promise<TranslationResult | null> => {
    const hasContent = Object.values(content).some(v => v?.trim());
    if (!hasContent) {
      toast.error('Aucun contenu à traduire');
      return null;
    }

    setIsTranslating(true);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'translateMissing',
          content,
          sourceLocale,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur de traduction');
      }

      const result: TranslationResult = await response.json();

      if (result.success) {
        toast.success('Traductions complétées avec succès');
        options.onSuccess?.(result.translations);
      } else if (result.errors?.length) {
        toast.warning(`Traduction partielle: ${result.errors.join(', ')}`);
        options.onSuccess?.(result.translations);
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur de traduction';
      toast.error(message);
      options.onError?.(message);
      return null;
    } finally {
      setIsTranslating(false);
    }
  }, [options]);

  return {
    translate,
    translateMissing,
    isTranslating,
  };
}
