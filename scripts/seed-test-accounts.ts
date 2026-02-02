/**
 * Seed Test Accounts Script
 *
 * Creates test accounts for E2E testing:
 * - Diver account
 * - Center Owner account (with approved center)
 * - Admin account
 *
 * Run with: pnpm tsx scripts/seed-test-accounts.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TEST_ACCOUNTS = {
  diver: {
    email: "test-diver@evidive.test",
    password: "TestDiver123!",
    firstName: "Test",
    lastName: "Diver",
    userType: "DIVER" as const,
  },
  centerOwner: {
    email: "test-center@evidive.test",
    password: "TestCenter123!",
    firstName: "Test",
    lastName: "CenterOwner",
    userType: "CENTER_OWNER" as const,
  },
  admin: {
    email: "admin@evidive.test",
    password: "AdminTest123!",
    firstName: "Test",
    lastName: "Admin",
    userType: "ADMIN" as const,
  },
};

async function main() {
  console.log("🌱 Seeding test accounts...\n");

  // Create or update test accounts
  for (const [name, account] of Object.entries(TEST_ACCOUNTS)) {
    const hashedPassword = await bcrypt.hash(account.password, 12);

    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: {
        password: hashedPassword,
        userType: account.userType,
      },
      create: {
        email: account.email,
        password: hashedPassword,
        userType: account.userType,
        profile: {
          create: {
            firstName: account.firstName,
            lastName: account.lastName,
            emailVerified: true,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    console.log(`✅ ${name}: ${account.email}`);
    console.log(`   Password: ${account.password}`);
    console.log(`   Type: ${account.userType}`);
    console.log(`   ID: ${user.id}\n`);

    // Create center for center owner
    if (account.userType === "CENTER_OWNER") {
      const existingCenter = await prisma.diveCenter.findFirst({
        where: { ownerId: user.id },
      });

      if (!existingCenter) {
        const center = await prisma.diveCenter.create({
          data: {
            ownerId: user.id,
            slug: "test-dive-center",
            name: { fr: "Centre de Test", en: "Test Dive Center" },
            description: {
              fr: "Centre de plongée de test pour les tests E2E",
              en: "Test dive center for E2E testing",
            },
            email: account.email,
            phone: "+33123456789",
            website: "https://test.evidive.com",
            address: "123 Test Street",
            city: "Test City",
            country: "France",
            postalCode: "75000",
            latitude: 48.8566,
            longitude: 2.3522,
            status: "APPROVED",
            businessType: "DIVE_CENTER",
            currency: "EUR",
            languages: ["fr", "en"],
            amenities: ["parking", "wifi", "showers"],
            certificationOrgs: ["PADI", "SSI"],
          },
        });

        console.log(`   📍 Created test center: ${center.slug}`);

        // Create a test service for the center
        const service = await prisma.service.create({
          data: {
            centerId: center.id,
            name: { fr: "Baptême de plongée", en: "Discovery Dive" },
            description: {
              fr: "Première expérience de plongée pour débutants",
              en: "First diving experience for beginners",
            },
            price: 79.0,
            currency: "EUR",
            durationMinutes: 120,
            minParticipants: 1,
            maxParticipants: 4,
            isActive: true,
            category: "DISCOVERY",
            minCertification: null,
            pricePerPerson: true,
            startTimes: ["09:00", "14:00"],
            availableDays: [1, 2, 3, 4, 5, 6, 0],
          },
        });

        console.log(`   🏊 Created test service: ${service.id}\n`);
      } else {
        console.log(`   📍 Center already exists: ${existingCenter.slug}\n`);
      }
    }
  }

  console.log("\n✨ Test accounts seeded successfully!");
  console.log("\n📋 Summary:");
  console.log("────────────────────────────────────────");
  console.log("| Account Type   | Email                        | Password        |");
  console.log("────────────────────────────────────────");
  console.log("| Diver          | test-diver@evidive.test      | TestDiver123!   |");
  console.log("| Center Owner   | test-center@evidive.test     | TestCenter123!  |");
  console.log("| Admin          | admin@evidive.test           | AdminTest123!   |");
  console.log("────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding test accounts:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
