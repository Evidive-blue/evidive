"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  centerApi,
  type CenterStats,
  type CenterResponse,
  type BookingResponse,
} from "@/lib/api";
import {
  BookOpen,
  Briefcase,
  Clock,
  ArrowRight,
  RefreshCw,
  CalendarDays,
  Plus,
  Users,
  Star,
  TrendingUp,
} from "lucide-react";
import { PageSkeleton } from "@/components/admin/loading-skeleton";
import { StatusBadge } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LoadState = "loading" | "ready" | "error";

export function DashboardOverviewClient(): React.ReactNode {
  const t = useTranslations("dashboard");
  const format = useFormatter();
  const [state, setState] = useState<LoadState>("loading");
  const [stats, setStats] = useState<CenterStats | null>(null);
  const [profile, setProfile] = useState<CenterResponse | null>(null);
  const [recentBookings, setRecentBookings] = useState<BookingResponse[]>([]);

  const formatCurrency = useCallback(
    (cents: number): string =>
      format.number(cents / 100, { style: "currency", currency: "EUR" }),
    [format]
  );

  const formatAmount = useCallback(
    (amount: number | string): string =>
      format.number(parseFloat(String(amount)) || 0, { style: "currency", currency: "EUR" }),
    [format]
  );

  const load = useCallback(async () => {
    setState("loading");
    try {
      const profileData = await centerApi.getProfile();
      setProfile(profileData);

      const kpisOrStats = await centerApi
        .getKPIs()
        .catch(
          (): CenterStats => ({
            bookings: { total: 0, pending: 0 },
            services: { total: 0, active: 0 },
            revenue: { total_cents: 0 },
          })
        );
      setStats(kpisOrStats);

      const bookingsData = await centerApi
        .getBookings({ limit: 5 })
        .catch(() => [] as BookingResponse[]);
      setRecentBookings(bookingsData);

      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: data fetching on mount
  useEffect(() => {
    load();
  }, [load]);

  if (state === "loading") {
    return (
      <div className="mx-auto max-w-3xl">
        <PageSkeleton />
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <h2 className="text-lg font-semibold text-white">{t("overview")}</h2>
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4">
          <p className="flex-1 text-sm text-red-400">{t("loadError")}</p>
          <Button
            onClick={load}
            variant="ghost"
            size="sm"
            className="gap-1.5 text-red-300 hover:bg-red-500/10 hover:text-red-200"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {t("retry")}
          </Button>
        </div>
      </div>
    );
  }

  const totalBookings = stats?.bookings?.total ?? 0;
  const pendingBookings = stats?.bookings?.pending ?? 0;
  const activeServices = stats?.services?.active ?? 0;
  const totalRevenueCents = stats?.revenue?.total_cents ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* ── Header ── */}
      {profile && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white md:text-xl">
              {profile.display_name}
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              {profile.city}
              {profile.city && profile.country ? ", " : ""}
              {profile.country}
            </p>
          </div>
          <Button
            onClick={load}
            variant="ghost"
            size="sm"
            className="text-slate-500 hover:text-slate-300"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-800/60 bg-slate-800/40 md:grid-cols-4">
        <KpiCell
          icon={BookOpen}
          accent="cyan"
          label={t("totalBookings")}
          value={String(totalBookings)}
        />
        <KpiCell
          icon={Clock}
          accent="amber"
          label={t("pendingBookings")}
          value={String(pendingBookings)}
          highlight={pendingBookings > 0}
        />
        <KpiCell
          icon={Briefcase}
          accent="emerald"
          label={t("activeServices")}
          value={String(activeServices)}
        />
        <KpiCell
          icon={TrendingUp}
          accent="violet"
          label={t("totalRevenue")}
          value={formatCurrency(totalRevenueCents)}
        />
      </div>

      {/* ── Recent bookings ── */}
      <section className="rounded-xl border border-slate-800/60 bg-slate-900/30">
        <div className="flex items-center justify-between border-b border-slate-800/40 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-300">
            {t("recentBookings")}
          </h2>
          <Link
            href="/dashboard/bookings"
            className="flex items-center gap-1 text-xs font-medium text-cyan-400 transition-colors hover:text-cyan-300"
          >
            {t("viewBooking")}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="px-4 py-8">
            <EmptyState icon={BookOpen} title={t("noBookings")} />
          </div>
        ) : (
          <div className="divide-y divide-slate-800/30">
            {recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-slate-800/15"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <StatusBadge status={booking.status} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-200">
                      {booking.service?.name ?? "\u2014"}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {booking.client?.first_name}{" "}
                      {booking.client?.last_name}
                      {" \u00b7 "}
                      {booking.start_time
                        ? format.dateTime(new Date(booking.start_time), {
                            dateStyle: "medium",
                          })
                        : "\u2014"}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 pl-3 text-sm tabular-nums font-medium text-slate-400">
                  {formatAmount(
                    booking.price ?? booking.total_price ?? 0
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Quick actions ── */}
      <section>
        <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
          {t("quickActions")}
        </h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <ActionTile
            href="/dashboard/services"
            icon={Plus}
            label={t("addService")}
          />
          <ActionTile
            href="/dashboard/team"
            icon={Users}
            label={t("addStaff")}
          />
          <ActionTile
            href="/dashboard/calendar"
            icon={CalendarDays}
            label={t("calendar")}
          />
          <ActionTile
            href="/dashboard/reviews"
            icon={Star}
            label={t("reviews")}
          />
        </div>
      </section>
    </div>
  );
}

/* ─── Sub-components ─── */

const ACCENT = {
  cyan: { icon: "text-cyan-400", dot: "bg-cyan-400" },
  amber: { icon: "text-amber-400", dot: "bg-amber-400" },
  emerald: { icon: "text-emerald-400", dot: "bg-emerald-400" },
  violet: { icon: "text-violet-400", dot: "bg-violet-400" },
} as const;

type Accent = keyof typeof ACCENT;

function KpiCell({
  icon: Icon,
  accent,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  accent: Accent;
  label: string;
  value: string;
  highlight?: boolean;
}): React.ReactNode {
  const colors = ACCENT[accent];
  return (
    <div className="relative bg-slate-900/60 px-4 py-3">
      {highlight && (
        <span
          className={cn("absolute right-3 top-3 h-1.5 w-1.5 rounded-full", colors.dot)}
        />
      )}
      <div className="flex items-center gap-2">
        <Icon className={cn("h-3.5 w-3.5 shrink-0", colors.icon)} />
        <span className="truncate text-[11px] text-slate-500">{label}</span>
      </div>
      <p className="mt-1 text-lg font-bold tabular-nums text-white md:text-xl">
        {value}
      </p>
    </div>
  );
}

function ActionTile({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}): React.ReactNode {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center gap-2 rounded-xl border border-slate-800/50 bg-slate-900/20 px-3 py-4 text-center transition-all hover:border-cyan-500/20 hover:bg-cyan-500/5"
    >
      <div className="rounded-lg bg-slate-800/50 p-2.5 transition-colors group-hover:bg-cyan-500/10">
        <Icon className="h-4 w-4 text-slate-400 transition-colors group-hover:text-cyan-400" />
      </div>
      <span className="text-xs font-medium text-slate-400 transition-colors group-hover:text-white">
        {label}
      </span>
    </Link>
  );
}
