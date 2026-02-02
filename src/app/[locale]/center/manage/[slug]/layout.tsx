import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CenterManageNav } from "@/components/center/CenterManageNav";

type LocalizedJson = Record<string, unknown>;

function getLocalizedText(value: unknown, locale: string): string {
  if (!value || typeof value !== "object") return "";

  const obj = value as LocalizedJson;
  const direct = obj[locale];
  if (typeof direct === "string" && direct.trim().length > 0) return direct;

  const fallback = obj.fr;
  if (typeof fallback === "string" && fallback.trim().length > 0) return fallback;

  const en = obj.en;
  if (typeof en === "string" && en.trim().length > 0) return en;

  for (const key of Object.keys(obj)) {
    const v = obj[key];
    if (typeof v === "string" && v.trim().length > 0) return v;
  }

  return "";
}

export default async function CenterManageLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;

  const session = await auth();

  // Redirect if not authenticated
  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  // Check if user is CENTER_OWNER or ADMIN
  const userType = session.user.userType;
  if (userType !== "CENTER_OWNER" && userType !== "ADMIN") {
    redirect(`/${locale}/dashboard`);
  }

  // Find the center by slug and verify ownership
  const center = await prisma.diveCenter.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      status: true,
      verified: true,
      ownerId: true,
    },
  });

  // Center not found
  if (!center) {
    notFound();
  }

  // Verify ownership (ADMIN can access any center)
  if (userType !== "ADMIN" && center.ownerId !== session.user.id) {
    redirect(`/${locale}/dashboard`);
  }

  // Get all user's centers for the switcher
  const userCenters = await prisma.diveCenter.findMany({
    where: { ownerId: session.user.id },
    select: {
      id: true,
      slug: true,
      name: true,
      status: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const centerName = getLocalizedText(center.name, locale) || center.slug;

  const centersForNav = userCenters.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: getLocalizedText(c.name, locale) || c.slug,
    status: c.status,
  }));

  return (
    <div className="min-h-screen">
      <CenterManageNav
        currentCenter={{
          id: center.id,
          slug: center.slug,
          name: centerName,
          status: center.status,
          verified: center.verified,
        }}
        centers={centersForNav}
        locale={locale}
      />
      {children}
    </div>
  );
}
