import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import { hash, compare } from "bcryptjs";

async function main() {
  const prisma = new PrismaClient().$extends(withAccelerate());

  try {
    const testPassword = "Test123!";
    const hashedPassword = await hash(testPassword, 12);

    console.log("Resetting passwords for all test users to 'Test123!'...\n");

    // Update all test accounts
    const emails = [
      "jean.diver@test.com",
      "marie.seller@test.com",
      "paul.center@test.com",
    ];

    for (const email of emails) {
      await prisma.profile.update({
        where: { email },
        data: { passwordHash: hashedPassword },
      });
      console.log(`Updated password for: ${email}`);
    }

    console.log("\n✓ All passwords reset to 'Test123!'");

    // Verify
    console.log("\nVerifying passwords...");
    const users = await prisma.profile.findMany({
      where: { email: { in: emails } },
      select: { email: true, passwordHash: true },
    });

    for (const user of users) {
      const isValid = await compare(testPassword, user.passwordHash!);
      console.log(`  ${user.email}: ${isValid ? "✓" : "✗"}`);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
