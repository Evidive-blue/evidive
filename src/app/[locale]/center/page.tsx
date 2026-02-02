import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "centerDashboard" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function CenterDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const t = await getTranslations({ locale, namespace: "centerDashboard" });

  // Redirect if not authenticated
  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  // Check if user is CENTER_OWNER or ADMIN
  const userType = session.user.userType;
  if (userType !== "CENTER_OWNER" && userType !== "ADMIN") {
    redirect(`/${locale}/dashboard`);
  }

  // Find the user's centers
  const centers = await prisma.diveCenter.findMany({
    where: { ownerId: session.user.id },
    select: {
      id: true,
      slug: true,
      status: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // If no center found, redirect to center creation
  if (centers.length === 0) {
    redirect(`/${locale}/onboard/center`);
  }

  // Redirect to the first center's new multi-center dashboard
  const center = centers[0];

  // If center is approved, redirect to multi-center dashboard
  if (center.status === "APPROVED") {
    redirect(`/${locale}/center/manage/${center.slug}`);
  }

  // Center is not approved - show a pending status message
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-8 backdrop-blur-xl">
          <h1 className="text-2xl font-bold text-amber-200">
            {t("pendingApproval.title")}
          </h1>
          <p className="mt-4 text-amber-200/80">
            {t("pendingApproval.description")}
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard"
              className="inline-block rounded-xl bg-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/20"
            >
              {t("pendingApproval.backToDashboard")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
