/**
 * Service de traduction automatique utilisant DeepL API
 * Documentation: https://www.deepl.com/docs-api
 */

import { supportedLocales, type Locale } from './config';

// Mapping des codes de langue Evidive → DeepL
const DEEPL_LANG_MAP: Record<Locale, string> = {
  fr: 'FR',
  en: 'EN',
  de: 'DE',
  es: 'ES',
  it: 'IT',
  pt: 'PT',
  nl: 'NL',
  pl: 'PL',
  el: 'EL',
  ru: 'RU',
  sv: 'SV',
};

// Langues supportées par DeepL (toutes nos langues sont supportées)
const DEEPL_SUPPORTED_TARGETS = Object.values(DEEPL_LANG_MAP);

export type TranslationResult = {
  success: boolean;
  translations: Record<Locale, string>;
  errors?: string[];
};

export type TranslateOptions = {
  sourceLocale?: Locale;
  targetLocales?: Locale[];
  preserveFormatting?: boolean;
};

/**
 * Traduit un texte vers toutes les langues cibles avec DeepL
 */
export async function translateText(
  text: string,
  options: TranslateOptions = {}
): Promise<TranslationResult> {
  const {
    sourceLocale = 'fr',
    targetLocales = supportedLocales.filter((l: Locale) => l !== sourceLocale),
    preserveFormatting = true,
  } = options;

  const apiKey = process.env.DEEPL_API_KEY;
  
  if (!apiKey) {
    return {
      success: false,
      translations: { [sourceLocale]: text } as Record<Locale, string>,
      errors: ['DEEPL_API_KEY non configurée dans les variables d\'environnement'],
    };
  }

  const translations: Record<string, string> = {
    [sourceLocale]: text,
  };
  const errors: string[] = [];

  // DeepL API endpoint (utilise l'API gratuite ou pro selon la clé)
  const apiUrl = apiKey.endsWith(':fx')
    ? 'https://api-free.deepl.com/v2/translate'
    : 'https://api.deepl.com/v2/translate';

  // Traduire vers chaque langue cible
  const translationPromises = targetLocales.map(async (targetLocale: Locale) => {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: [text],
          source_lang: DEEPL_LANG_MAP[sourceLocale],
          target_lang: DEEPL_LANG_MAP[targetLocale],
          preserve_formatting: preserveFormatting,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.translations?.[0]?.text) {
        translations[targetLocale] = data.translations[0].text;
      } else {
        throw new Error('Réponse invalide de DeepL');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      errors.push(`${targetLocale}: ${message}`);
      // En cas d'erreur, on garde le texte source
      translations[targetLocale] = text;
    }
  });

  await Promise.all(translationPromises);

  return {
    success: errors.length === 0,
    translations: translations as Record<Locale, string>,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Traduit un objet multilingue existant vers les langues manquantes
 */
export async function translateMissingLocales(
  content: Record<string, string>,
  options: { sourceLocale?: Locale } = {}
): Promise<TranslationResult> {
  // Trouver la langue source (première langue disponible)
  const availableLocales = Object.keys(content).filter(
    (key): key is Locale => supportedLocales.includes(key as Locale) && Boolean(content[key]?.trim())
  );

  if (availableLocales.length === 0) {
    return {
      success: false,
      translations: content as Record<Locale, string>,
      errors: ['Aucun contenu source disponible'],
    };
  }

  const sourceLocale = options.sourceLocale && availableLocales.includes(options.sourceLocale)
    ? options.sourceLocale
    : availableLocales[0];

  const sourceText = content[sourceLocale];
  
  // Trouver les langues manquantes
  const missingLocales = supportedLocales.filter(
    (locale: Locale) => !content[locale]?.trim()
  );

  if (missingLocales.length === 0) {
    return {
      success: true,
      translations: content as Record<Locale, string>,
    };
  }

  // Traduire vers les langues manquantes
  const result = await translateText(sourceText, {
    sourceLocale,
    targetLocales: missingLocales,
  });

  // Fusionner avec le contenu existant
  return {
    ...result,
    translations: {
      ...content,
      ...result.translations,
    } as Record<Locale, string>,
  };
}

/**
 * Vérifie l'utilisation de l'API DeepL (quota)
 */
export async function getDeepLUsage(): Promise<{
  characterCount: number;
  characterLimit: number;
  percentUsed: number;
} | null> {
  const apiKey = process.env.DEEPL_API_KEY;
  
  if (!apiKey) return null;

  const apiUrl = apiKey.endsWith(':fx')
    ? 'https://api-free.deepl.com/v2/usage'
    : 'https://api.deepl.com/v2/usage';

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    
    return {
      characterCount: data.character_count || 0,
      characterLimit: data.character_limit || 500000,
      percentUsed: Math.round((data.character_count / data.character_limit) * 100),
    };
  } catch {
    return null;
  }
}
