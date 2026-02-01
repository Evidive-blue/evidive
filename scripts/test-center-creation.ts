import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { sendEmail } from "@/lib/mailer";
import { getAdminEmail } from "@/lib/admin";

async function main() {
  const adminEmail = getAdminEmail();
  if (!adminEmail) {
    throw new Error("ADMIN_EMAIL is not configured.");
  }

  const stamp = Date.now();
  const email = `center.test+${stamp}@example.com`;
  const passwordHash = await hashPassword("Test1234A");

  const profile = await prisma.profile.create({
    data: {
      email,
      passwordHash,
      displayName: `Test Center Owner ${stamp}`,
      userType: "CENTER_OWNER",
      preferredLanguage: "fr",
      address: "1 Test Street",
      city: "Testville",
      country: "FR",
      isActive: true,
    },
    select: { id: true, email: true },
  });

  const slug = `test-center-${stamp}-${profile.id.slice(0, 6)}`;
  const center = await prisma.diveCenter.create({
    data: {
      ownerId: profile.id,
      slug,
      name: { fr: "Centre Test", en: "Test Center", es: "Centro Test", it: "Centro Test" },
      description: {
        fr: "Description test",
        en: "Test description",
        es: "Descripcion test",
        it: "Descrizione test",
      },
      address: "1 Test Street",
      city: "Testville",
      zip: "00000",
      country: "FR",
      latitude: 0,
      longitude: 0,
      email,
      phone: "+33000000000",
      status: "PENDING",
    },
    select: { id: true, slug: true, status: true, email: true },
  });

  await sendEmail({
    to: adminEmail,
    subject: `[EviDive] Nouveau centre en attente: Centre Test (${center.slug})`,
    template: "center_pending",
    text: [
      "Un nouveau centre vient d’être créé et est en attente de validation.",
      "",
      `Slug: ${center.slug}`,
      `Email centre: ${center.email}`,
      `CenterId: ${center.id}`,
    ].join("\n"),
    metadata: { centerId: center.id, slug: center.slug },
    centerId: center.id,
    userId: profile.id,
  });

  console.log({ createdProfileId: profile.id, createdCenterId: center.id, status: center.status });
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

