import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Waves, Star, Calendar } from "lucide-react";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  QuickStatsCard,
  UpcomingDivesWidget,
  RecentHistoryWidget,
  QuickActionsWidget,
} from "@/components/dashboard";

function normalizeDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });

  return {
    title: t("welcome", { name: "" }).trim() + " | EviDive",
    description: t("subtitle"),
  };
}

export default async function DiverDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const t = await getTranslations({ locale, namespace: "dashboard" });

  // Redirect if not authenticated
  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  // Redirect non-divers to their respective dashboards
  if (session.user.userType === "SELLER") {
    redirect(`/${locale}/dashboard/seller`);
  }
  if (session.user.userType === "CENTER_OWNER" || session.user.userType === "ADMIN") {
    redirect(`/${locale}/dashboard/center`);
  }

  const userId = session.user.id;
  const today = normalizeDateOnly(new Date());

  // Fetch all data in parallel
  const [
    profile,
    upcomingBookings,
    pastBookings,
    completedDivesCount,
    reviewsCount,
    pendingBookingsCount,
  ] = await Promise.all([
    // User profile
    prisma.profile.findUnique({
      where: { id: userId },
      select: { displayName: true, firstName: true, lastName: true },
    }),

    // Upcoming bookings (CONFIRMED or PAID)
    prisma.booking.findMany({
      where: {
        userId,
        diveDate: { gte: today },
        status: { in: ["CONFIRMED", "PAID"] },
      },
      include: {
        center: {
          select: {
            id: true,
            slug: true,
            name: true,
            city: true,
            country: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: 3,
      orderBy: { diveDate: "asc" },
    }),

    // Past bookings (COMPLETED) with review
    prisma.booking.findMany({
      where: {
        userId,
        status: "COMPLETED",
      },
      include: {
        center: {
          select: {
            id: true,
            slug: true,
            name: true,
            city: true,
            country: true,
          },
        },
        review: {
          select: {
            id: true,
            rating: true,
          },
        },
      },
      take: 3,
      orderBy: { diveDate: "desc" },
    }),

    // Count completed dives
    prisma.booking.count({
      where: {
        userId,
        status: "COMPLETED",
      },
    }),

    // Count reviews given
    prisma.review.count({
      where: {
        userId,
      },
    }),

    // Count all upcoming bookings for stat
    prisma.booking.count({
      where: {
        userId,
        diveDate: { gte: today },
        status: { in: ["PENDING", "CONFIRMED", "PAID", "RUNNING"] },
      },
    }),
  ]);

  // Build display name
  const displayName =
    profile?.displayName ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    session.user.name ||
    session.user.email ||
    t("defaultName");

  // Stats data
  const stats = [
    {
      label: t("stats.completedDives"),
      value: completedDivesCount,
      icon: Waves,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
    },
    {
      label: t("stats.upcomingBookings"),
      value: pendingBookingsCount,
      icon: Calendar,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: t("stats.reviewsGiven"),
      value: reviewsCount,
      icon: Star,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
  ];

  // Translations for widgets
  const upcomingTranslations = {
    title: t("upcoming.title"),
    viewDetails: t("upcoming.viewDetails"),
    emptyTitle: t("upcoming.emptyTitle"),
    emptyDesc: t("upcoming.emptyDesc"),
    exploreOffers: t("upcoming.exploreOffers"),
    status: {
      PENDING: t("upcoming.status.PENDING"),
      CONFIRMED: t("upcoming.status.CONFIRMED"),
      PAID: t("upcoming.status.PAID"),
      RUNNING: t("upcoming.status.RUNNING"),
      COMPLETED: t("upcoming.status.COMPLETED"),
      CANCELLED: t("upcoming.status.CANCELLED"),
      NOSHOW: t("upcoming.status.NOSHOW"),
      REMOVED: t("upcoming.status.REMOVED"),
    },
  };

  const historyTranslations = {
    title: t("history.title"),
    viewAll: t("history.viewAll"),
    emptyTitle: t("history.emptyTitle"),
    emptyDesc: t("history.emptyDesc"),
    leaveReview: t("history.leaveReview"),
    rating: t("history.rating"),
  };

  const quickActionsTranslations = {
    title: t("quickActions.title"),
    searchDive: t("quickActions.searchDive"),
    searchDiveDesc: t("quickActions.searchDiveDesc"),
    myBookings: t("quickActions.myBookings"),
    myBookingsDesc: t("quickActions.myBookingsDesc"),
    myReviews: t("quickActions.myReviews"),
    myReviewsDesc: t("quickActions.myReviewsDesc"),
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {t("welcome", { name: displayName })}
              </h1>
              <p className="text-white/70">{t("subtitle")}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-3">
          {stats.map((stat) => (
            <QuickStatsCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              bgColor={stat.bgColor}
            />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Main Widgets (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Dives */}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <UpcomingDivesWidget
              bookings={upcomingBookings as any}
              locale={locale}
              translations={upcomingTranslations}
            />

            {/* Recent History */}
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <RecentHistoryWidget
              bookings={pastBookings as any}
              locale={locale}
              translations={historyTranslations}
            />
          </div>

          {/* Right Column - Quick Actions (1 col) */}
          <div className="space-y-6">
            <QuickActionsWidget translations={quickActionsTranslations} />
          </div>
        </div>
      </div>
    </div>
  );
}
