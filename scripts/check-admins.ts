import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

async function main() {
  const prisma = new PrismaClient().$extends(withAccelerate());

  try {
    console.log("=== Listing all users ===\n");

    const allUsers = await prisma.profile.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        displayName: true,
        userType: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("All users in database:");
    console.log("-".repeat(80));
    for (const user of allUsers) {
      const name = user.displayName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "N/A";
      const isAdmin = user.userType === "ADMIN" ? "✓ ADMIN" : user.userType;
      console.log(`${user.email.padEnd(40)} | ${name.padEnd(20)} | ${isAdmin}`);
    }
    console.log("-".repeat(80));
    console.log(`Total: ${allUsers.length} users\n`);

    // Find admins
    const admins = allUsers.filter((u) => u.userType === "ADMIN");
    console.log(`\n=== Current ADMINS (${admins.length}) ===`);
    if (admins.length === 0) {
      console.log("No admins found!");
    } else {
      for (const admin of admins) {
        console.log(`  - ${admin.email}`);
      }
    }

    // Check for Armando and Jerome
    console.log("\n=== Checking Armando and Jerome ===");
    const armandoUsers = allUsers.filter((u) =>
      u.email.toLowerCase().includes("armando") ||
      u.firstName?.toLowerCase().includes("armando") ||
      u.lastName?.toLowerCase().includes("armando") ||
      u.displayName?.toLowerCase().includes("armando")
    );
    const jeromeUsers = allUsers.filter((u) =>
      u.email.toLowerCase().includes("jerome") ||
      u.firstName?.toLowerCase().includes("jerome") ||
      u.lastName?.toLowerCase().includes("jerome") ||
      u.displayName?.toLowerCase().includes("jerome")
    );

    console.log("\nArmando matches:");
    if (armandoUsers.length === 0) {
      console.log("  No user with 'armando' found");
    } else {
      for (const u of armandoUsers) {
        console.log(`  - ${u.email} (${u.userType})`);
      }
    }

    console.log("\nJerome matches:");
    if (jeromeUsers.length === 0) {
      console.log("  No user with 'jerome' found");
    } else {
      for (const u of jeromeUsers) {
        console.log(`  - ${u.email} (${u.userType})`);
      }
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
