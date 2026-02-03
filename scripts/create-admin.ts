import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@evidive.blue";
  const password = "Admin1234!";
  const passwordHash = await hash(password, 12);

  console.log("Creating admin user...");
  console.log(`Email: ${email}`);

  const user = await prisma.diver.upsert({
    where: { email },
    update: {
      role: "ADMIN",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      passwordHash,
    },
    create: {
      email,
      passwordHash,
      displayName: "Admin",
      firstName: "Admin",
      lastName: "EviDive",
      role: "ADMIN",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      preferredLanguage: "fr",
    },
  });

  console.log(`Admin user created/updated: ${user.id}`);
  console.log("\n=== CREDENTIALS ===");
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log("===================\n");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
