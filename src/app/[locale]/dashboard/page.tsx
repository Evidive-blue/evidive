import { Link } from "@/i18n/navigation";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  Calendar,
  Waves,
  MapPin,
  ChevronRight,
  TrendingUp,
  Bell,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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

function normalizeDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  const t = await getTranslations({ locale, namespace: "dashboard" });

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  if (session.user.userType === "SELLER") {
    redirect(`/${locale}/dashboard/seller`);
  }
  if (session.user.userType === "CENTER_OWNER" || session.user.userType === "ADMIN") {
    redirect(`/${locale}/dashboard/center`);
  }

  const today = normalizeDateOnly(new Date());

  const profile = await prisma.profile.findUnique({
    where: { id: session.user.id },
    select: { totalDives: true, displayName: true },
  });

  const upcomingBookingsCount = await prisma.booking.count({
    where: {
      userId: session.user.id,
      diveDate: { gte: today },
      status: { in: ["PENDING", "CONFIRMED", "PAID", "RUNNING"] },
    },
  });

  const upcomingBookings = await prisma.booking.findMany({
    where: {
      userId: session.user.id,
      diveDate: { gte: today },
      status: { in: ["PENDING", "CONFIRMED", "PAID", "RUNNING"] },
    },
    orderBy: [{ diveDate: "asc" }, { diveTime: "asc" }],
    select: {
      id: true,
      reference: true,
      diveDate: true,
      diveTime: true,
      status: true,
      centerId: true,
      serviceId: true,
    },
    take: 5,
  });

  const centerIds = Array.from(new Set(upcomingBookings.map((b) => b.centerId)));
  const serviceIds = Array.from(new Set(upcomingBookings.map((b) => b.serviceId)));

  const [centers, services] = await Promise.all([
    centerIds.length > 0
      ? prisma.diveCenter.findMany({
          where: { id: { in: centerIds } },
          select: { id: true, slug: true, name: true, city: true, country: true },
        })
      : [],
    serviceIds.length > 0
      ? prisma.diveService.findMany({
          where: { id: { in: serviceIds } },
          select: { id: true, name: true, durationMinutes: true },
        })
      : [],
  ]);

  const centerById = new Map(centers.map((c) => [c.id, c]));
  const serviceById = new Map(services.map((s) => [s.id, s]));

  const unreadNotificationsCount = await prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  });

  const recentNotifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, message: true, linkUrl: true, createdAt: true, isRead: true },
    take: 5,
  });

  const reviewsCount = await prisma.review.count({ where: { userId: session.user.id } });

  const displayName = profile?.displayName || session.user.name || session.user.email || t("defaultName");
  const totalDives = profile?.totalDives ?? 0;

  // Stats cards data
  const stats = [
    {
      label: t("stats.totalDives"),
      value: String(totalDives),
      icon: Waves,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
    },
    {
      label: t("stats.upcomingBookings"),
      value: String(upcomingBookingsCount),
      icon: Calendar,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: t("stats.unreadNotifications"),
      value: String(unreadNotificationsCount),
      icon: Bell,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
    {
      label: t("stats.reviews"),
      value: String(reviewsCount),
      icon: TrendingUp,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
  ];

  // Quick actions
  const quickActions = [
    {
      label: t("actions.explore"),
      href: "/explorer",
      icon: MapPin,
      description: t("actions.exploreDesc"),
    },
    {
      label: t("actions.findCenter"),
      href: "/centers",
      icon: Waves,
      description: t("actions.findCenterDesc"),
    },
    {
      label: t("quickActions.myReviews"),
      href: "/reviews",
      icon: Star,
      description: t("quickActions.myReviewsDesc"),
    },
    {
      label: t("actions.profile"),
      href: "/profile",
      icon: TrendingUp,
      description: t("actions.profileDesc"),
    },
  ];

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
            <div className="flex items-center gap-3" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card
              key={stat.label}
              className="border-white/10 bg-white/5 backdrop-blur-xl"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      stat.bgColor
                    )}
                  >
                    <stat.icon className={cn("h-5 w-5", stat.color)} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-white/60">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content - Bookings */}
          <div className="lg:col-span-2">
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader className="border-b border-white/10">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-cyan-400" />
                    {t("bookings.title")}
                  </CardTitle>
                  <Link href="/explorer">
                    <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300">
                      {t("bookings.viewAll")}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {upcomingBookings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                      <Calendar className="h-8 w-8 text-white/40" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-white">
                      {t("bookings.emptyTitle")}
                    </h3>
                    <p className="mb-6 max-w-sm text-sm text-white/60">
                      {t("bookings.emptyDesc")}
                    </p>
                    <Link href="/explorer">
                      <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500">
                        <MapPin className="mr-2 h-4 w-4" />
                        {t("bookings.exploreButton")}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingBookings.map((b) => {
                      const center = centerById.get(b.centerId);
                      const service = serviceById.get(b.serviceId);
                      const centerName = center ? getLocalizedText(center.name, locale) || center.slug : b.centerId;
                      const serviceName = service ? getLocalizedText(service.name, locale) || b.reference : b.reference;
                      const locationLabel = center ? [center.city, center.country].filter(Boolean).join(", ") : "";
                      return (
                        <div
                          key={b.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-white">
                              {serviceName}
                            </div>
                            <div className="truncate text-xs text-white/60">
                              {locationLabel ? `${centerName} · ${locationLabel}` : centerName}
                            </div>
                          </div>
                          <div className="text-xs text-white/60 tabular-nums">
                            {new Date(b.diveDate).toLocaleDateString(locale)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Quick Actions & Notifications */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="text-white text-base">
                  {t("quickActions.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {quickActions.map((action) => (
                    <Link key={action.href} href={action.href}>
                      <div className="flex items-center gap-3 rounded-xl p-3 transition-all hover:bg-white/5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
                          <action.icon className="h-5 w-5 text-cyan-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {action.label}
                          </p>
                          <p className="text-xs text-white/50 truncate">
                            {action.description}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-white/40" />
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Bell className="h-4 w-4 text-cyan-400" />
                  {t("notifications.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {recentNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Bell className="mb-3 h-8 w-8 text-white/30" />
                    <p className="text-sm text-white/60">
                      {t("notifications.empty")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentNotifications.map((n) => (
                      <div key={n.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className={cn("truncate text-sm font-medium", n.isRead ? "text-white/70" : "text-white")}>
                              {n.title}
                            </div>
                            <div className="truncate text-xs text-white/50">{n.message}</div>
                          </div>
                          <div className="shrink-0 text-xs text-white/40">
                            {new Date(n.createdAt).toLocaleDateString(locale)}
                          </div>
                        </div>
                        {n.linkUrl ? (
                          <div className="mt-2">
                            <Link href={n.linkUrl} className="text-xs text-cyan-300 hover:text-cyan-200">
                              {t("notifications.open")}
                            </Link>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
