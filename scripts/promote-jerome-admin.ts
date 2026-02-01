import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

async function main() {
  const prisma = new PrismaClient().$extends(withAccelerate());

  try {
    const jeromeEmail = "jerome.ethenoz@gmail.com";

    console.log(`Promoting ${jeromeEmail} to ADMIN...`);

    const updated = await prisma.profile.update({
      where: { email: jeromeEmail },
      data: { userType: "ADMIN" },
      select: {
        id: true,
        email: true,
        displayName: true,
        userType: true,
      },
    });

    console.log("\n✓ User promoted to ADMIN:");
    console.log(`  Email: ${updated.email}`);
    console.log(`  Name: ${updated.displayName}`);
    console.log(`  Type: ${updated.userType}`);

    // Verify all admins now
    console.log("\n=== Current ADMINS ===");
    const admins = await prisma.profile.findMany({
      where: { userType: "ADMIN" },
      select: { email: true, displayName: true },
    });

    for (const admin of admins) {
      console.log(`  - ${admin.email} (${admin.displayName})`);
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
