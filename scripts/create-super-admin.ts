import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import * as bcrypt from "bcryptjs";

async function main() {
  const prisma = new PrismaClient().$extends(withAccelerate());

  try {
    const email = "admin@evidive.com";
    const password = "SuperAdmin2026!";
    const passwordHash = await bcrypt.hash(password, 10);

    console.log(`Creating super admin account...`);

    // Check if user already exists
    const existing = await prisma.profile.findUnique({
      where: { email },
    });

    if (existing) {
      console.log(`\n⚠️  User ${email} already exists. Updating to ADMIN...`);
      const updated = await prisma.profile.update({
        where: { email },
        data: { 
          userType: "ADMIN",
          emailVerified: true,
          emailVerifiedAt: new Date(),
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          userType: true,
          emailVerified: true,
        },
      });

      console.log("\n✓ User updated to ADMIN:");
      console.log(`  Email: ${updated.email}`);
      console.log(`  Name: ${updated.displayName}`);
      console.log(`  Type: ${updated.userType}`);
    } else {
      const created = await prisma.profile.create({
        data: {
          email,
          passwordHash,
          firstName: "Super",
          lastName: "Admin",
          displayName: "Super Admin",
          userType: "ADMIN",
          emailVerified: true,
          emailVerifiedAt: new Date(),
          isActive: true,
          preferredLanguage: "fr",
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          userType: true,
        },
      });

      console.log("\n✓ Super admin created successfully:");
      console.log(`  Email: ${created.email}`);
      console.log(`  Password: ${password}`);
      console.log(`  Name: ${created.displayName}`);
      console.log(`  Type: ${created.userType}`);
      console.log("\n⚠️  IMPORTANT: Save these credentials securely!");
    }

    // Verify all admins
    console.log("\n=== Current ADMINS ===");
    const admins = await prisma.profile.findMany({
      where: { userType: "ADMIN" },
      select: { email: true, displayName: true, emailVerified: true },
    });

    for (const admin of admins) {
      console.log(`  - ${admin.email} (${admin.displayName}) - Verified: ${admin.emailVerified}`);
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
