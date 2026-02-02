import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Connecting to database...");

  // Get users
  const users = await prisma.profile.findMany({
    take: 10,
    select: {
      id: true,
      email: true,
      userType: true,
      firstName: true,
      lastName: true,
    },
  });

  console.log("\n=== Users in database ===");
  console.log(JSON.stringify(users, null, 2));
  console.log(`Total: ${users.length} users found`);

  // Get centers
  const centers = await prisma.diveCenter.findMany({
    take: 5,
    select: {
      id: true,
      slug: true,
      status: true,
      ownerId: true,
    },
  });

  console.log("\n=== Dive Centers ===");
  console.log(JSON.stringify(centers, null, 2));
  console.log(`Total: ${centers.length} centers found`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
