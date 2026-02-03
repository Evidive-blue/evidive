import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Waves, Calendar, Star, ArrowRight, Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import type { JsonValue } from "@prisma/client/runtime/library";
import { getLocale } from "@/lib/i18n/get-locale-server";
import { getMessages, getNestedValue } from "@/lib/i18n/get-messages";
import { getTranslationsServer } from "@/lib/i18n/get-translations-server";

// Helper to extract name from JSON (multilingual)
function getName(name: JsonValue, locale = "en"): string {
  if (typeof name === "string") return name;
  if (name && typeof name === "object" && !Array.isArray(name)) {
    const obj = name as Record<string, unknown>;
    return (obj[locale] as string) || (obj.en as string) || (obj.fr as string) || "Unnamed";
  }
  return "Unnamed";
}

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
    title: requireString(messages, "metadata.dashboard.title"),
    description: requireString(messages, "metadata.dashboard.description"),
  };
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { locale, t } = await getTranslationsServer("userDashboard");
  const { t: tCommon } = await getTranslationsServer("common");

  const user = await prisma.diver.findUnique({
    where: { id: session.user.id },
    include: {
      centers: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          _count: {
            select: {
              bookings: true,
              reviews: true,
            },
          },
        },
      },
      bookings: {
        where: {
          diveDate: { gte: new Date() },
        },
        orderBy: { diveDate: "asc" },
        take: 5,
        include: {
          center: {
            select: { name: true, slug: true },
          },
          service: {
            select: { name: true },
          },
        },
      },
      _count: {
        select: {
          bookings: true,
          reviews: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const defaultName = t("defaultGreeting");
  const hasCenters = user.centers.length > 0;
  const hasUpcomingBookings = user.bookings.length > 0;

  return (
    <div className="min-h-screen pb-16 pt-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            {t("greeting", { name: user.displayName || user.firstName || defaultName })}
          </h1>
          <p className="mt-2 text-white/60">
            {t("overview")}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20">
                <Waves className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {user.totalDives || 0}
                </p>
                <p className="text-sm text-white/60">{t("stats.totalDives")}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20">
                <Calendar className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{user._count.bookings}</p>
                <p className="text-sm text-white/60">{t("stats.bookings")}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20">
                <Star className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{user._count.reviews}</p>
                <p className="text-sm text-white/60">{t("stats.reviews")}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                <Building2 className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{user.centers.length}</p>
                <p className="text-sm text-white/60">{t("stats.myCenters")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Upcoming Bookings */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">{t("upcoming.title")}</h2>
              <Link
                href="/bookings"
                className="text-sm text-cyan-400 hover:text-cyan-300"
              >
                {t("upcoming.viewAll")}
              </Link>
            </div>

            {hasUpcomingBookings ? (
              <div className="space-y-4">
                {user.bookings.map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/bookings/${booking.id}`}
                    className="block rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">
                          {booking.service ? getName(booking.service.name, locale) : tCommon("unnamed")}
                        </p>
                        <p className="text-sm text-white/60">{getName(booking.center.name)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-cyan-400">
                          {new Date(booking.diveDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-white/40">
                          {t("divers", { count: booking.participants })}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Waves className="mx-auto h-12 w-12 text-white/20" />
                <p className="mt-4 text-white/60">{t("upcoming.noUpcoming")}</p>
                <Link
                  href="/centers"
                  className="mt-4 inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
                >
                  {t("upcoming.browse")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>

          {/* My Centers */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">{t("myCenters.title")}</h2>
              <Link
                href="/onboard/center"
                className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300"
              >
                <Plus className="h-4 w-4" />
                {t("myCenters.addCenter")}
              </Link>
            </div>

            {hasCenters ? (
              <div className="space-y-4">
                {user.centers.map((center) => (
                  <Link
                    key={center.id}
                    href={`/center/manage/${center.slug}`}
                    className="block rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{getName(center.name)}</p>
                        <div className="mt-1 flex items-center gap-4 text-sm text-white/60">
                          <span>{t("myCenters.bookings", { count: center._count.bookings })}</span>
                          <span>{t("myCenters.reviews", { count: center._count.reviews })}</span>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          center.status === "APPROVED"
                            ? "bg-green-500/20 text-green-400"
                            : center.status === "PENDING"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {center.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Building2 className="mx-auto h-12 w-12 text-white/20" />
                <p className="mt-4 text-white/60">{t("myCenters.noCenters")}</p>
                <Link
                  href="/onboard/center"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-medium text-white hover:from-cyan-400 hover:to-blue-400"
                >
                  {t("myCenters.register")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h2 className="mb-6 text-xl font-semibold text-white">{t("quickActions.title")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/centers"
              className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
                <Waves className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="font-medium text-white">{t("quickActions.findDives")}</p>
                <p className="text-sm text-white/60">{t("quickActions.browseCenters")}</p>
              </div>
            </Link>

            <Link
              href="/bookings"
              className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                <Calendar className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-white">{t("quickActions.myBookings")}</p>
                <p className="text-sm text-white/60">{t("quickActions.viewHistory")}</p>
              </div>
            </Link>

            <Link
              href="/profile"
              className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                <svg
                  className="h-5 w-5 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-white">{t("quickActions.editProfile")}</p>
                <p className="text-sm text-white/60">{t("quickActions.updateInfo")}</p>
              </div>
            </Link>

            <Link
              href="/settings"
              className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-500/20">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium text-white">{t("quickActions.settings")}</p>
                <p className="text-sm text-white/60">{t("quickActions.preferences")}</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
