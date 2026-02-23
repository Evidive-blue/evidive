"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { StatCard } from "./stat-card";
import { adminApi, type AdminStats } from "@/lib/api";
import {
  Users,
  MapPin,
  BookOpen,
  CreditCard,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";

export function AdminDashboardClient() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .getStats()
      .then(setStats)
      .catch(() => setError(t("loadError")))
      .finally(() => setLoading(false));
  }, [t]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">{t("dashboard")}</h2>
        <div className="flex items-center justify-center gap-3 py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          <span className="text-slate-400">{tCommon("loading")}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">{t("dashboard")}</h2>
        <div className="rounded-lg bg-red-500/20 px-4 py-3 text-red-400">
          {error}
        </div>
      </div>
    );
  }

  const totalCenters = (stats?.active_centers ?? 0) + (stats?.pending_centers ?? 0);
  const pendingCenters = stats?.pending_centers ?? 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">{t("dashboard")}</h2>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("users")}
          value={String(stats?.total_users ?? 0)}
          description={t("dashboardUsers")}
          icon={Users}
        />
        <StatCard
          title={t("centers")}
          value={String(totalCenters)}
          description={t("dashboardCenters")}
          icon={MapPin}
        />
        <StatCard
          title={t("bookings")}
          value={String(stats?.total_bookings ?? 0)}
          description={t("dashboardBookings")}
          icon={BookOpen}
        />
        <StatCard
          title={t("reviews")}
          value={String(stats?.total_reviews ?? 0)}
          description={t("dashboardReviews")}
          icon={CreditCard}
        />
      </div>

      {/* Alerts */}
      {pendingCenters > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div className="flex-1 space-y-2">
              <h3 className="font-medium text-amber-400">{t("alerts")}</h3>
              <p className="text-sm text-slate-300">
                {t("pendingBookingsAlert", { count: pendingCenters })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h3 className="mb-4 font-medium text-white">{t("quickLinks")}</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLink
            href="/admin/centers"
            label={t("viewPendingCenters")}
            sublabel={`${pendingCenters} ${t("pending").toLowerCase()}`}
            icon={MapPin}
          />
          <QuickLink
            href="/admin/bookings"
            label={t("viewPendingBookings")}
            sublabel={t("bookings")}
            icon={BookOpen}
          />
          <QuickLink
            href="/admin/reviews"
            label={t("reviews")}
            sublabel={t("navContentSection")}
            icon={CreditCard}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h3 className="mb-4 font-medium text-white">{t("recentActivity")}</h3>
        <p className="text-sm text-slate-400">{t("noRecentActivity")}</p>
      </div>
    </div>
  );
}

function QuickLink({
  href,
  label,
  sublabel,
  icon: Icon,
}: {
  href: string;
  label: string;
  sublabel: string;
  icon: typeof Users;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-800/30 p-4 transition-all hover:border-cyan-500/30 hover:bg-cyan-500/5"
    >
      <div className="rounded-lg bg-cyan-500/10 p-2">
        <Icon className="h-5 w-5 text-cyan-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white group-hover:text-cyan-400">
          {label}
        </p>
        <p className="truncate text-xs text-slate-500">{sublabel}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-400" />
    </Link>
  );
}
