/**
 * Utilitaire unifié pour extraire le contenu localisé des champs JSON multilingues
 */

import type { Locale } from './config';
import type { JsonValue } from '@prisma/client/runtime/library';

/**
 * Extrait le contenu dans la langue demandée avec fallbacks
 * Priorité: locale demandée → en → fr → première valeur disponible → fallback
 */
export function getLocalizedContent(
  content: JsonValue | Record<string, string> | null | undefined,
  locale: Locale,
  fallback: string = ''
): string {
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return fallback;
  }

  const obj = content as Record<string, string>;

  // Priorité de fallback: locale → en → fr → première disponible
  const value = obj[locale] || obj['en'] || obj['fr'] || Object.values(obj)[0];

  return value?.trim() || fallback;
}

/**
 * Vérifie si un contenu multilingue a toutes les traductions
 */
export function hasAllTranslations(
  content: JsonValue | Record<string, string> | null | undefined,
  requiredLocales: Locale[]
): boolean {
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return false;
  }

  const obj = content as Record<string, string>;
  
  return requiredLocales.every(locale => obj[locale]?.trim());
}

/**
 * Retourne les langues manquantes pour un contenu multilingue
 */
export function getMissingLocales(
  content: JsonValue | Record<string, string> | null | undefined,
  allLocales: Locale[]
): Locale[] {
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return allLocales;
  }

  const obj = content as Record<string, string>;
  
  return allLocales.filter(locale => !obj[locale]?.trim());
}

/**
 * Crée un objet multilingue à partir d'une valeur unique
 */
export function createMultilingualContent(
  value: string,
  locales: Locale[] = ['fr', 'en']
): Record<Locale, string> {
  return locales.reduce((acc, locale) => {
    acc[locale] = value;
    return acc;
  }, {} as Record<Locale, string>);
}

/**
 * Met à jour une langue spécifique dans un contenu multilingue
 */
export function updateLocalizedContent(
  content: JsonValue | Record<string, string> | null | undefined,
  locale: Locale,
  value: string
): Record<string, string> {
  const existing = (content && typeof content === 'object' && !Array.isArray(content))
    ? content as Record<string, string>
    : {};

  return {
    ...existing,
    [locale]: value,
  };
}
