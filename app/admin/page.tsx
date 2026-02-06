import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Users, Calendar, AlertTriangle, ArrowRight, Settings } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { getLocale } from "@/lib/i18n/get-locale-server";
import { getMessages, getNestedValue } from "@/lib/i18n/get-messages";
import { getTranslationsServer } from "@/lib/i18n/get-translations-server";

function requireString(messages: Record<string, unknown>, path: string): string {
  const value = getNestedValue(messages, path);
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing i18n string: ${path}`);
  }
  return value;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  return {
    title: requireString(messages, "metadata.admin.title"),
    description: requireString(messages, "metadata.admin.description"),
  };
}

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { t } = await getTranslationsServer("adminDashboard");

  // Fetch stats
  const [
    totalCenters,
    pendingCenters,
    approvedCenters,
    totalUsers,
    totalBookings,
    recentCenters,
  ] = await Promise.all([
    prisma.center.count(),
    prisma.center.count({ where: { status: "PENDING" } }),
    prisma.center.count({ where: { status: "APPROVED" } }),
    prisma.diver.count(),
    prisma.booking.count(),
    prisma.center.findMany({
      where: { status: "PENDING" },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        name: true,
        city: true,
        country: true,
        createdAt: true,
        owner: {
          select: {
            displayName: true,
            email: true,
          },
        },
      },
    }),
  ]);

  // Helper to extract name from JSON
  function getName(name: unknown): string {
    if (typeof name === "string") return name;
    if (name && typeof name === "object" && !Array.isArray(name)) {
      const obj = name as Record<string, unknown>;
      return (obj.en as string) || (obj.fr as string) || "Unnamed";
    }
    return "Unnamed";
  }

  return (
    <div className="min-h-screen pb-16 pt-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">{t("title")}</h1>
          <p className="mt-2 text-white/60">
            {t("description")}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                <Building2 className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalCenters}</p>
                <p className="text-sm text-white/60">{t("stats.totalCenters")}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
                <AlertTriangle className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{pendingCenters}</p>
                <p className="text-sm text-white/60">{t("stats.pendingApproval")}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalUsers}</p>
                <p className="text-sm text-white/60">{t("stats.totalUsers")}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20">
                <Calendar className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{totalBookings}</p>
                <p className="text-sm text-white/60">{t("stats.totalBookings")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Pending Centers */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                {t("pendingCenters.title")}
                {pendingCenters > 0 && (
                  <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-sm text-amber-400">
                    {pendingCenters}
                  </span>
                )}
              </h2>
              <Link
                href="/admin/centers?status=PENDING"
                className="text-sm text-cyan-400 hover:text-cyan-300"
              >
                {t("pendingCenters.viewAll")}
              </Link>
            </div>

            {recentCenters.length > 0 ? (
              <div className="space-y-3">
                {recentCenters.map((center) => (
                  <Link
                    key={center.id}
                    href={`/admin/centers/${center.id}`}
                    className="block rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">
                          {getName(center.name)}
                        </p>
                        <p className="text-sm text-white/60">
                          {center.city}, {center.country}
                        </p>
                        {center.owner && (
                          <p className="mt-1 text-xs text-white/40">
                            by {center.owner.displayName || center.owner.email}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="rounded-full bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-400">
                          {t("pendingCenters.status")}
                        </span>
                        <p className="mt-1 text-xs text-white/40">
                          {new Date(center.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Building2 className="mx-auto h-12 w-12 text-white/20" />
                <p className="mt-4 text-white/60">{t("pendingCenters.noPending")}</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="mb-6 text-xl font-semibold text-white">{t("quickActions.title")}</h2>
            <div className="space-y-3">
              <Link
                href="/admin/centers"
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
                    <Building2 className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{t("quickActions.manageCenters")}</p>
                    <p className="text-sm text-white/60">
                      {t("quickActions.centersCount", { approved: approvedCenters, pending: pendingCenters })}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-white/40" />
              </Link>

              <Link
                href="/admin/users"
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                    <Users className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{t("quickActions.manageUsers")}</p>
                    <p className="text-sm text-white/60">{t("quickActions.usersCount", { count: totalUsers })}</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-white/40" />
              </Link>

              <Link
                href="/admin/bookings"
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
                    <Calendar className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{t("quickActions.viewBookings")}</p>
                    <p className="text-sm text-white/60">{t("quickActions.bookingsCount", { count: totalBookings })}</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-white/40" />
              </Link>

              <Link
                href="/admin/settings"
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                    <Settings className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">Paramètres globaux</p>
                    <p className="text-sm text-white/60">Commission, tarifs, options</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-white/40" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
