/**
 * API Route pour la traduction automatique avec DeepL
 * POST /api/translate
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { translateText, translateMissingLocales, getDeepLUsage } from '@/lib/i18n/translate-service';
import { supportedLocales, type Locale } from '@/lib/i18n/config';
import { auth } from '@/lib/auth';

// Create a mutable copy for Zod enum
const localesArray = [...supportedLocales] as [Locale, ...Locale[]];

const translateSchema = z.object({
  text: z.string().min(1, 'Le texte est requis'),
  sourceLocale: z.enum(localesArray).optional(),
  targetLocales: z.array(z.enum(localesArray)).optional(),
});

const translateMissingSchema = z.object({
  content: z.record(z.string()),
  sourceLocale: z.enum(localesArray).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification (seuls les utilisateurs connectés peuvent traduire)
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const action = body.action || 'translate';

    if (action === 'translate') {
      // Traduction simple d'un texte
      const data = translateSchema.parse(body);
      
      const result = await translateText(data.text, {
        sourceLocale: data.sourceLocale,
        targetLocales: data.targetLocales,
      });

      return NextResponse.json(result);
    }

    if (action === 'translateMissing') {
      // Traduire les langues manquantes d'un contenu existant
      const data = translateMissingSchema.parse(body);
      
      const result = await translateMissingLocales(data.content, {
        sourceLocale: data.sourceLocale,
      });

      return NextResponse.json(result);
    }

    if (action === 'usage') {
      // Vérifier le quota DeepL
      const usage = await getDeepLUsage();
      
      if (!usage) {
        return NextResponse.json(
          { error: 'Impossible de récupérer les informations d\'utilisation' },
          { status: 500 }
        );
      }

      return NextResponse.json(usage);
    }

    return NextResponse.json(
      { error: 'Action non reconnue' },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[Translate API] Error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la traduction' },
      { status: 500 }
    );
  }
}
