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
  const t = await getTranslations({ locale, namespace: "adminDashboard" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const t = await getTranslations({ locale, namespace: "adminDashboard" });

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  if (session.user.userType !== "ADMIN") {
    redirect(`/${locale}/dashboard`);
  }

  // Fetch all admin stats in parallel
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1);

  const [
    totalUsers,
    newUsersThisMonth,
    totalCenters,
    pendingCenters,
    approvedCenters,
    totalBookings,
    bookingsThisMonth,
    pendingBookings,
    /* totalReviews - not used */,
    pendingReviews,
    totalRevenue,
    revenueThisMonth,
    recentUsers,
    recentCenters,
  ] = await Promise.all([
    // Users
    prisma.profile.count(),
    prisma.profile.count({
      where: { createdAt: { gte: startOfMonth } },
    }),
    // Centers
    prisma.diveCenter.count(),
    prisma.diveCenter.count({ where: { status: "PENDING" } }),
    prisma.diveCenter.count({ where: { status: "APPROVED" } }),
    // Bookings
    prisma.booking.count(),
    prisma.booking.count({
      where: { createdAt: { gte: startOfMonth } },
    }),
    prisma.booking.count({ where: { status: "PENDING" } }),
    // Reviews
    prisma.review.count(),
    prisma.review.count({ where: { status: "PENDING" } }),
    // Revenue (commissions)
    prisma.commission.aggregate({
      where: { status: "PAID" },
      _sum: { commissionAmount: true },
    }),
    prisma.commission.aggregate({
      where: { status: "PAID", createdAt: { gte: startOfMonth } },
      _sum: { commissionAmount: true },
    }),
    // Recent users (last 5)
    prisma.profile.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        email: true,
        displayName: true,
        userType: true,
        createdAt: true,
      },
    }),
    // Recent centers (last 5)
    prisma.diveCenter.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  const platformRevenue = Number(totalRevenue._sum?.commissionAmount || 0);
  const monthRevenue = Number(revenueThisMonth._sum?.commissionAmount || 0);

  // Helper to get localized name
  function getLocalizedName(name: unknown): string {
    if (!name || typeof name !== "object") return "";
    const obj = name as Record<string, unknown>;
    return (
      (typeof obj[locale] === "string" && obj[locale]) ||
      (typeof obj.en === "string" && obj.en) ||
      (typeof obj.fr === "string" && obj.fr) ||
      ""
    ) as string;
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">{t("title")}</h1>
            <p className="mt-2 text-white/60">{t("subtitle")}</p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-xl transition hover:bg-white/10"
          >
            {t("backToDashboard")}
          </Link>
        </div>

        {/* Main Stats Grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Users */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="text-3xl">👥</div>
              <span className="text-xs text-emerald-400">+{newUsersThisMonth} {t("stats.thisMonth")}</span>
            </div>
            <div className="mt-4 text-2xl font-bold text-white">{totalUsers}</div>
            <div className="text-sm text-white/60">{t("stats.totalUsers")}</div>
          </div>

          {/* Centers */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="text-3xl">🏢</div>
              {pendingCenters > 0 && (
                <span className="text-xs text-amber-400">{pendingCenters} {t("stats.pending")}</span>
              )}
            </div>
            <div className="mt-4 text-2xl font-bold text-white">{totalCenters}</div>
            <div className="text-sm text-white/60">{t("stats.totalCenters")} ({approvedCenters} {t("stats.approved")})</div>
          </div>

          {/* Bookings */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="text-3xl">📅</div>
              <span className="text-xs text-cyan-400">+{bookingsThisMonth} {t("stats.thisMonth")}</span>
            </div>
            <div className="mt-4 text-2xl font-bold text-white">{totalBookings}</div>
            <div className="text-sm text-white/60">{t("stats.totalBookings")} ({pendingBookings} {t("stats.pending")})</div>
          </div>

          {/* Revenue */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="text-3xl">💰</div>
              <span className="text-xs text-emerald-400">+{monthRevenue.toFixed(2)}€ {t("stats.thisMonth")}</span>
            </div>
            <div className="mt-4 text-2xl font-bold text-white">{platformRevenue.toFixed(2)}€</div>
            <div className="text-sm text-white/60">{t("stats.platformRevenue")}</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white mb-4">{t("quickActions.title")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Link
              href="/admin/users"
              className="rounded-xl border border-white/10 bg-white/5 p-4 text-center transition hover:bg-white/10"
            >
              <div className="text-2xl mb-1">👥</div>
              <div className="text-xs font-medium text-white/80">{t("quickActions.users")}</div>
              <div className="mt-1 text-xs text-white/50">{totalUsers}</div>
            </Link>

            <Link
              href="/admin/centers"
              className={`rounded-xl border p-4 text-center transition ${
                pendingCenters > 0
                  ? "border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="text-2xl mb-1">🏢</div>
              <div className={`text-xs font-medium ${pendingCenters > 0 ? "text-amber-200" : "text-white/80"}`}>
                {t("quickActions.centers")}
              </div>
              {pendingCenters > 0 && (
                <div className="mt-1 text-xs text-amber-300">{pendingCenters} {t("stats.pending")}</div>
              )}
            </Link>

            <Link
              href="/admin/bookings"
              className="rounded-xl border border-white/10 bg-white/5 p-4 text-center transition hover:bg-white/10"
            >
              <div className="text-2xl mb-1">📅</div>
              <div className="text-xs font-medium text-white/80">{t("quickActions.bookings")}</div>
              <div className="mt-1 text-xs text-white/50">{totalBookings}</div>
            </Link>

            <Link
              href="/admin/reviews"
              className={`rounded-xl border p-4 text-center transition ${
                pendingReviews > 0
                  ? "border-cyan-500/20 bg-cyan-500/10 hover:bg-cyan-500/20"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="text-2xl mb-1">⭐</div>
              <div className={`text-xs font-medium ${pendingReviews > 0 ? "text-cyan-200" : "text-white/80"}`}>
                {t("quickActions.reviews")}
              </div>
              {pendingReviews > 0 && (
                <div className="mt-1 text-xs text-cyan-300">{pendingReviews} {t("stats.pending")}</div>
              )}
            </Link>

            <Link
              href="/admin/commissions"
              className="rounded-xl border border-white/10 bg-white/5 p-4 text-center transition hover:bg-white/10"
            >
              <div className="text-2xl mb-1">💰</div>
              <div className="text-xs font-medium text-white/80">{t("quickActions.commissions")}</div>
              <div className="mt-1 text-xs text-white/50">{platformRevenue.toFixed(0)}€</div>
            </Link>

            <Link
              href="/explorer"
              className="rounded-xl border border-white/10 bg-white/5 p-4 text-center transition hover:bg-white/10"
            >
              <div className="text-2xl mb-1">🌍</div>
              <div className="text-xs font-medium text-white/80">{t("quickActions.explorer")}</div>
            </Link>
          </div>
        </div>

        {/* Recent Activity Grid */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Recent Users */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">{t("recentUsers.title")}</h2>
              <Link href="/admin/users" className="text-xs text-cyan-400 hover:text-cyan-300">
                {t("viewAll")}
              </Link>
            </div>
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3">
                  <div>
                    <div className="text-sm font-medium text-white">{user.displayName || user.email}</div>
                    <div className="text-xs text-white/50">{user.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/70">
                      {user.userType}
                    </span>
                    <span className="text-xs text-white/40">
                      {new Date(user.createdAt).toLocaleDateString(locale)}
                    </span>
                  </div>
                </div>
              ))}
              {recentUsers.length === 0 && (
                <div className="text-sm text-white/50 text-center py-4">{t("recentUsers.empty")}</div>
              )}
            </div>
          </div>

          {/* Recent Centers */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">{t("recentCenters.title")}</h2>
              <Link href="/admin/centers" className="text-xs text-cyan-400 hover:text-cyan-300">
                {t("viewAll")}
              </Link>
            </div>
            <div className="space-y-3">
              {recentCenters.map((center) => (
                <div key={center.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3">
                  <div>
                    <div className="text-sm font-medium text-white">
                      {getLocalizedName(center.name) || center.slug}
                    </div>
                    <div className="text-xs text-white/50">{center.slug}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${
                      center.status === "APPROVED"
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                        : center.status === "PENDING"
                        ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
                        : "border-red-500/20 bg-red-500/10 text-red-200"
                    }`}>
                      {center.status}
                    </span>
                    <span className="text-xs text-white/40">
                      {new Date(center.createdAt).toLocaleDateString(locale)}
                    </span>
                  </div>
                </div>
              ))}
              {recentCenters.length === 0 && (
                <div className="text-sm text-white/50 text-center py-4">{t("recentCenters.empty")}</div>
              )}
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        {(pendingCenters > 0 || pendingBookings > 0 || pendingReviews > 0) && (
          <div className="mt-8 rounded-3xl border border-amber-500/20 bg-amber-500/10 p-6 backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-amber-200 mb-4">{t("alerts.title")}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pendingCenters > 0 && (
                <Link
                  href="/admin/centers"
                  className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 transition hover:bg-amber-500/20"
                >
                  <span className="text-2xl">🏢</span>
                  <div>
                    <div className="text-sm font-medium text-amber-200">{pendingCenters} {t("alerts.pendingCenters")}</div>
                    <div className="text-xs text-amber-200/60">{t("alerts.needsValidation")}</div>
                  </div>
                </Link>
              )}
              {pendingBookings > 0 && (
                <Link
                  href="/admin/bookings?status=PENDING"
                  className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 transition hover:bg-amber-500/20"
                >
                  <span className="text-2xl">📅</span>
                  <div>
                    <div className="text-sm font-medium text-amber-200">{pendingBookings} {t("alerts.pendingBookings")}</div>
                    <div className="text-xs text-amber-200/60">{t("alerts.awaitingConfirmation")}</div>
                  </div>
                </Link>
              )}
              {pendingReviews > 0 && (
                <Link
                  href="/admin/reviews?status=PENDING"
                  className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 transition hover:bg-amber-500/20"
                >
                  <span className="text-2xl">⭐</span>
                  <div>
                    <div className="text-sm font-medium text-amber-200">{pendingReviews} {t("alerts.pendingReviews")}</div>
                    <div className="text-xs text-amber-200/60">{t("alerts.needsModeration")}</div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
