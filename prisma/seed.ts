import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

// 9 catégories de plongée prédéfinies (multilingue)
const diveCategories = [
  {
    slug: "beach-dive",
    name: {
      fr: "Plongée depuis la plage",
      en: "Beach dive",
      es: "Buceo desde la playa",
      it: "Immersione dalla spiaggia",
    },
    sortOrder: 1,
  },
  {
    slug: "boat-dive",
    name: {
      fr: "Plongée en bateau",
      en: "Boat dive",
      es: "Buceo en barco",
      it: "Immersione in barca",
    },
    sortOrder: 2,
  },
  {
    slug: "double-beach-dive",
    name: {
      fr: "Plongée double depuis la plage",
      en: "Double beach dive",
      es: "Buceo doble desde la playa",
      it: "Doppia immersione dalla spiaggia",
    },
    sortOrder: 3,
  },
  {
    slug: "double-boat-dive",
    name: {
      fr: "Plongée double en bateau",
      en: "Double boat dive",
      es: "Buceo doble en barco",
      it: "Doppia immersione in barca",
    },
    sortOrder: 4,
  },
  {
    slug: "discover-scuba-diving",
    name: {
      fr: "Baptême de plongée",
      en: "Discover Scuba Diving",
      es: "Bautismo de buceo",
      it: "Battesimo subacqueo",
    },
    sortOrder: 5,
  },
  {
    slug: "try-dive",
    name: {
      fr: "Plongée découverte",
      en: "Try Dive",
      es: "Buceo de prueba",
      it: "Prova subacquea",
    },
    sortOrder: 6,
  },
  {
    slug: "snorkeling",
    name: {
      fr: "Snorkeling",
      en: "Snorkeling",
      es: "Snorkel",
      it: "Snorkeling",
    },
    sortOrder: 7,
  },
  {
    slug: "full-day-diving",
    name: {
      fr: "Journée complète de plongée",
      en: "Full day diving",
      es: "Día completo de buceo",
      it: "Giornata completa di immersioni",
    },
    sortOrder: 8,
  },
  {
    slug: "liveaboard",
    name: {
      fr: "Croisière plongée",
      en: "Liveaboard",
      es: "Crucero de buceo",
      it: "Crociera subacquea",
    },
    sortOrder: 9,
  },
];

// Settings par défaut
const defaultSettings = [
  { key: "currency", value: "EUR", description: "Devise par défaut" },
  { key: "commission_rate", value: 80, description: "Taux commission centre (%)" },
  { key: "reminder_time", value: 24, description: "Rappel client (heures avant)" },
  { key: "reminder_time_worker", value: 4, description: "Rappel centre (heures avant)" },
  { key: "cancel_limit", value: 24, description: "Délai annulation (heures avant)" },
  { key: "app_limit", value: 365, description: "Réservation max jours à l'avance" },
  { key: "min_time", value: 60, description: "Durée minimum service (minutes)" },
  { key: "payment_required", value: true, description: "Paiement obligatoire" },
  { key: "auto_confirm", value: false, description: "Confirmation automatique" },
  { key: "allow_cancel", value: false, description: "Client peut annuler" },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Seed admin user
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (adminEmail && adminPasswordHash) {
    console.log("👤 Creating admin user...");
    await prisma.profile.upsert({
      where: { email: adminEmail },
      update: { userType: "ADMIN" },
      create: {
        email: adminEmail,
        passwordHash: adminPasswordHash,
        displayName: "Admin",
        userType: "ADMIN",
        emailVerified: true,
        emailVerifiedAt: new Date(),
        preferredLanguage: "fr",
      },
    });
    console.log(`✅ Admin user created: ${adminEmail}`);
  } else {
    console.log("⚠️ ADMIN_EMAIL or ADMIN_PASSWORD_HASH not set, skipping admin creation");
  }

  // Seed catégories
  console.log("📂 Creating dive categories...");
  for (const category of diveCategories) {
    await prisma.diveCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log(`✅ Created ${diveCategories.length} dive categories`);

  // Seed settings
  console.log("⚙️ Creating default settings...");
  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: {
        key: setting.key,
        value: setting.value,
        description: setting.description,
      },
    });
  }
  console.log(`✅ Created ${defaultSettings.length} settings`);

  console.log("🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
