"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { toast } from "sonner";
import { adminApi, type AdminReportStats } from "@/lib/api";
import { Filter, BarChart3, BookOpen, DollarSign, Star, Users } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { TableSkeleton } from "@/components/admin/loading-skeleton";
import { EmptyState } from "@/components/admin/empty-state";
import { StatCard } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";

export function AdminReportsClient() {
  const t = useTranslations("admin");
  const format = useFormatter();
  const [stats, setStats] = useState<AdminReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [appliedFrom, setAppliedFrom] = useState<string>("");
  const [appliedTo, setAppliedTo] = useState<string>("");

  const loadReports = useCallback(async (from: string, to: string) => {
    setLoading(true);
    try {
      const params: {
        date_from?: string;
        date_to?: string;
      } = {};
      
      if (from) {
        params.date_from = from;
      }
      if (to) {
        params.date_to = to;
      }
      
      const data = await adminApi.getReports(params);
      setStats(data);
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadReports("", "");
  }, [loadReports]);

  const handleFilter = () => {
    setAppliedFrom(dateFrom);
    setAppliedTo(dateTo);
    loadReports(dateFrom, dateTo);
  };

  const formatCurrency = (amount: number | string): string =>
    format.number(parseFloat(String(amount)) || 0, {
      style: "currency",
      currency: "EUR",
    });

  return (
    <div className="space-y-6">
      <PageHeader titleKey="reports" />

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-sm text-slate-400">
              {t("dateFrom")}
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 transition-colors hover:border-slate-600 focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-sm text-slate-400">
              {t("dateTo")}
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 transition-colors hover:border-slate-600 focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            />
          </div>

          <div>
            <Button
              onClick={handleFilter}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              <Filter className="h-4 w-4" />
              {t("filter")}
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : !stats ? (
        <EmptyState icon={BarChart3} title={t("noResults")} />
      ) : (
        <>
          {(appliedFrom || appliedTo || (stats.date_from && stats.date_to)) && (
            <p className="text-sm text-slate-500">
              {t("reportPeriod")}:{" "}
              {appliedFrom || stats.date_from || "—"} —{" "}
              {appliedTo || stats.date_to || "—"}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title={t("totalBookings")}
              value={String(stats.total_bookings)}
              description={t("reportPeriod")}
              icon={BookOpen}
            />
            <StatCard
              title={t("totalRevenue")}
              value={formatCurrency(stats.total_revenue)}
              description={t("reportPeriod")}
              icon={DollarSign}
            />
            <StatCard
              title={t("totalCommissions")}
              value={formatCurrency(stats.total_commissions)}
              description={t("reportPeriod")}
              icon={DollarSign}
            />
            <StatCard
              title={t("reviews")}
              value={String(stats.total_reviews)}
              description={t("dashboardReviews")}
              icon={Star}
            />
            <StatCard
              title={t("averageRating")}
              value={
                stats.average_rating != null
                  ? stats.average_rating.toFixed(1)
                  : "—"
              }
              description={t("reviews")}
              icon={Users}
            />
          </div>
        </>
      )}
    </div>
  );
}
