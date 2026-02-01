import { prisma } from "@/lib/prisma";

async function main() {
  const email = "armando.romano@bluewin.ch";
  const user = await prisma.profile.findUnique({
    where: { email },
    select: { email: true, userType: true, emailVerified: true },
  });

  // Intentionally minimal output (no secrets)
  console.log(user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

