import { prisma } from "@/lib/prisma";

async function main() {
  const email = "armando.romano@bluewin.ch";
  const updated = await prisma.profile.update({
    where: { email },
    data: {
      userType: "ADMIN",
      emailVerified: true,
      emailVerifiedAt: new Date(),
      isActive: true,
      isBlacklisted: false,
    },
    select: { email: true, userType: true, emailVerified: true },
  });

  console.log(updated);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

