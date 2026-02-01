import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCenterStats } from "@/actions/center-stats";
import { StatsPageClient } from "@/components/center/stats/StatsPageClient";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "centerStats" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function CenterStatsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const t = await getTranslations({ locale, namespace: "centerStats" });

  // Redirect if not authenticated
  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  // Check if user is CENTER_OWNER or ADMIN
  const userType = session.user.userType;
  if (userType !== "CENTER_OWNER" && userType !== "ADMIN") {
    redirect(`/${locale}/dashboard`);
  }

  // Find the user's center
  const center = await prisma.diveCenter.findFirst({
    where: { ownerId: session.user.id },
    select: {
      id: true,
      slug: true,
      name: true,
      status: true,
    },
  });

  // If no center found, redirect to center creation
  if (!center) {
    redirect(`/${locale}/onboard/center`);
  }

  // If center is not approved, show a pending status message
  if (center.status !== "APPROVED") {
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
                href="/center"
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

  // Fetch initial stats
  const statsResult = await getCenterStats("12m", locale);
  
  if (!statsResult.success || !statsResult.data) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 backdrop-blur-xl">
            <h1 className="text-2xl font-bold text-red-200">
              {t("error.title")}
            </h1>
            <p className="mt-4 text-red-200/80">
              {t("error.description")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const centerName = getLocalizedText(center.name, locale) || "Mon centre";

  // Prepare translations for client component
  const translations = {
    periodSelector: {
      "30d": t("periods.30d"),
      "90d": t("periods.90d"),
      "12m": t("periods.12m"),
      all: t("periods.all"),
    },
    cards: {
      totalRevenue: t("cards.totalRevenue"),
      netRevenue: t("cards.netRevenue"),
      totalBookings: t("cards.totalBookings"),
      confirmationRate: t("cards.confirmationRate"),
      cancellationRate: t("cards.cancellationRate"),
      totalClients: t("cards.totalClients"),
      newClients: t("cards.newClients"),
      returnRate: t("cards.returnRate"),
      totalReviews: t("cards.totalReviews"),
      avgRating: t("cards.avgRating"),
      vsPreviousPeriod: t("cards.vsPreviousPeriod"),
    },
    charts: {
      revenueTitle: t("charts.revenueTitle"),
      grossRevenue: t("charts.grossRevenue"),
      netRevenue: t("charts.netRevenue"),
      commission: t("charts.commission"),
      bookingsTitle: t("charts.bookingsTitle"),
      bookings: t("charts.bookings"),
      reviewsTitle: t("charts.reviewsTitle"),
      reviews: t("charts.reviews"),
      avgRating: t("charts.avgRating"),
      noData: t("charts.noData"),
    },
    tables: {
      topServicesTitle: t("tables.topServicesTitle"),
      service: t("tables.service"),
      bookingsCount: t("tables.bookingsCount"),
      revenue: t("tables.revenue"),
      noData: t("tables.noData"),
    },
    loading: t("loading"),
    error: t("error.generic"),
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/center"
            className="mb-4 inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToDashboard")}
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">{t("title")}</h1>
              <p className="mt-2 text-white/60">
                {t("subtitle", { centerName })}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Content */}
        <StatsPageClient
          initialData={statsResult.data}
          locale={locale}
          translations={translations}
        />
      </div>
    </div>
  );
}
