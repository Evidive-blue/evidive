import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Créer admin
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@evidive.blue';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.diver.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      firstName: 'Admin',
      lastName: 'EviDive',
      displayName: 'Admin',
      role: 'ADMIN',
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log('✅ Admin créé:', admin.email);

  // Créer un plongeur de test
  const testDiver = await prisma.diver.upsert({
    where: { email: 'diver@evidive.blue' },
    update: {},
    create: {
      email: 'diver@evidive.blue',
      passwordHash: await bcrypt.hash('Diver123!', 10),
      firstName: 'Test',
      lastName: 'Plongeur',
      displayName: 'Test Plongeur',
      role: 'DIVER',
      certificationLevel: 'Advanced Open Water',
      certificationOrg: 'PADI',
      totalDives: 50,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  console.log('✅ Plongeur test créé:', testDiver.email);

  console.log('✨ Seed terminé !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
