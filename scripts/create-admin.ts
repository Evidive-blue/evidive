import { PrismaClient, UserType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function createAdmin() {
  // Récupérer email et mot de passe depuis args ou env
  const email = process.argv[2] || process.env.ADMIN_EMAIL;
  const password = process.argv[3] || process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("❌ Usage: npx tsx scripts/create-admin.ts <email> <password>");
    console.error("   ou définir ADMIN_EMAIL et ADMIN_PASSWORD dans .env.local");
    process.exit(1);
  }

  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.profile.findUnique({
      where: { email },
    });

    if (existingUser) {
      if (existingUser.userType === UserType.ADMIN) {
        console.log(`⚠️  Un admin existe déjà avec cet email: ${email}`);
        
        // Proposer de mettre à jour le mot de passe
        const passwordHash = await bcrypt.hash(password, 10);
        await prisma.profile.update({
          where: { email },
          data: { passwordHash },
        });
        console.log("✅ Mot de passe admin mis à jour!");
      } else {
        // Promouvoir l'utilisateur existant en ADMIN
        const passwordHash = await bcrypt.hash(password, 10);
        await prisma.profile.update({
          where: { email },
          data: {
            userType: UserType.ADMIN,
            passwordHash,
          },
        });
        console.log(`✅ Utilisateur ${email} promu ADMIN!`);
      }
    } else {
      // Créer un nouvel admin
      const passwordHash = await bcrypt.hash(password, 10);
      const admin = await prisma.profile.create({
        data: {
          email,
          passwordHash,
          userType: UserType.ADMIN,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          firstName: "Admin",
          displayName: "Admin",
        },
      });

      console.log("🎉 Admin créé avec succès!");
      console.log(`📧 Email: ${admin.email}`);
      console.log(`🆔 ID: ${admin.id}`);
      console.log(`👤 Type: ${admin.userType}`);
    }
  } catch (error) {
    console.error("❌ Erreur lors de la création de l'admin:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
