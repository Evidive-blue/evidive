/**
 * Script pour traduire automatiquement les centres existants
 * Usage: npx tsx scripts/translate-centers.ts
 * 
 * Nécessite DEEPL_API_KEY dans les variables d'environnement
 */

import { PrismaClient } from '@prisma/client';
import { translateMissingLocales } from '../lib/i18n/translate-service';

const prisma = new PrismaClient();

async function translateCenters() {
  console.log('🌍 Démarrage de la traduction des centres...\n');

  // Récupérer tous les centres
  const centers = await prisma.center.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      shortDescription: true,
    },
  });

  console.log(`📊 ${centers.length} centres trouvés\n`);

  let translated = 0;
  let errors = 0;

  for (const center of centers) {
    console.log(`\n📍 Traitement: ${center.slug}`);

    try {
      const updates: Record<string, unknown> = {};

      // Traduire le nom
      if (center.name && typeof center.name === 'object') {
        const nameResult = await translateMissingLocales(
          center.name as Record<string, string>
        );
        if (nameResult.success) {
          updates.name = nameResult.translations;
          console.log('  ✓ Nom traduit');
        }
      }

      // Traduire la description
      if (center.description && typeof center.description === 'object') {
        const descResult = await translateMissingLocales(
          center.description as Record<string, string>
        );
        if (descResult.success) {
          updates.description = descResult.translations;
          console.log('  ✓ Description traduite');
        }
      }

      // Traduire la description courte
      if (center.shortDescription && typeof center.shortDescription === 'object') {
        const shortResult = await translateMissingLocales(
          center.shortDescription as Record<string, string>
        );
        if (shortResult.success) {
          updates.shortDescription = shortResult.translations;
          console.log('  ✓ Description courte traduite');
        }
      }

      // Mettre à jour si nécessaire
      if (Object.keys(updates).length > 0) {
        await prisma.center.update({
          where: { id: center.id },
          data: updates,
        });
        translated++;
        console.log(`  💾 Centre mis à jour`);
      } else {
        console.log('  ⏭️  Pas de traduction nécessaire');
      }

      // Pause pour éviter de dépasser les limites de l'API
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`  ❌ Erreur: ${error instanceof Error ? error.message : 'Unknown'}`);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Traduction terminée`);
  console.log(`   - Centres traduits: ${translated}`);
  console.log(`   - Erreurs: ${errors}`);
  console.log('='.repeat(50));

  await prisma.$disconnect();
}

// Exécuter
translateCenters().catch((error) => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});
