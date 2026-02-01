"use client";

import { useState, useTransition } from "react";
import { getCenterStats, type StatsPeriod, type CenterStatsData } from "@/actions/center-stats";
import { PeriodSelector } from "./PeriodSelector";
import { StatsCard } from "./StatsCard";
import { RevenueChart } from "./RevenueChart";
import { BookingsChart } from "./BookingsChart";
import { TopServicesTable } from "./TopServicesTable";
import { ReviewsChart } from "./ReviewsChart";
import {
  Wallet,
  CalendarCheck,
  Users,
  Star,
  TrendingUp,
  CheckCircle,
  XCircle,
  UserPlus,
  RefreshCw,
} from "lucide-react";

interface StatsPageClientProps {
  initialData: CenterStatsData;
  locale: string;
  translations: {
    periodSelector: {
      "30d": string;
      "90d": string;
      "12m": string;
      all: string;
    };
    cards: {
      totalRevenue: string;
      netRevenue: string;
      totalBookings: string;
      confirmationRate: string;
      cancellationRate: string;
      totalClients: string;
      newClients: string;
      returnRate: string;
      totalReviews: string;
      avgRating: string;
      vsPreviousPeriod: string;
    };
    charts: {
      revenueTitle: string;
      grossRevenue: string;
      netRevenue: string;
      commission: string;
      bookingsTitle: string;
      bookings: string;
      reviewsTitle: string;
      reviews: string;
      avgRating: string;
      noData: string;
    };
    tables: {
      topServicesTitle: string;
      service: string;
      bookingsCount: string;
      revenue: string;
      noData: string;
    };
    loading: string;
    error: string;
  };
}

export function StatsPageClient({
  initialData,
  locale,
  translations: t,
}: StatsPageClientProps) {
  const [period, setPeriod] = useState<StatsPeriod>("12m");
  const [data, setData] = useState<CenterStatsData>(initialData);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handlePeriodChange = (newPeriod: StatsPeriod) => {
    setPeriod(newPeriod);
    setError(null);

    startTransition(async () => {
      const result = await getCenterStats(newPeriod, locale);
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || t.error);
      }
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-8">
      {/* Period Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PeriodSelector
          value={period}
          onChange={handlePeriodChange}
          translations={t.periodSelector}
        />
        {isPending && (
          <div className="flex items-center gap-2 text-sm text-white/60">
            <RefreshCw className="h-4 w-4 animate-spin" />
            {t.loading}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-300">
          {error}
        </div>
      )}

      {/* Revenue Stats */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-white/80">Revenus</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label={t.cards.totalRevenue}
            value={formatCurrency(data.totalRevenueBrut)}
            evolution={data.revenueEvolution}
            evolutionLabel={t.cards.vsPreviousPeriod}
            icon={Wallet}
            iconColor="text-cyan-400"
            iconBgColor="bg-cyan-500/10"
          />
          <StatsCard
            label={t.cards.netRevenue}
            value={formatCurrency(data.totalRevenueNet)}
            icon={TrendingUp}
            iconColor="text-emerald-400"
            iconBgColor="bg-emerald-500/10"
          />
        </div>
        <div className="mt-6">
          <RevenueChart
            data={data.revenueByMonth}
            translations={{
              title: t.charts.revenueTitle,
              grossRevenue: t.charts.grossRevenue,
              netRevenue: t.charts.netRevenue,
              commission: t.charts.commission,
              noData: t.charts.noData,
            }}
          />
        </div>
      </section>

      {/* Bookings Stats */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-white/80">Réservations</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label={t.cards.totalBookings}
            value={data.totalBookings}
            evolution={data.bookingsEvolution}
            evolutionLabel={t.cards.vsPreviousPeriod}
            icon={CalendarCheck}
            iconColor="text-cyan-400"
            iconBgColor="bg-cyan-500/10"
          />
          <StatsCard
            label={t.cards.confirmationRate}
            value={data.confirmationRate.toFixed(1)}
            suffix="%"
            icon={CheckCircle}
            iconColor="text-emerald-400"
            iconBgColor="bg-emerald-500/10"
          />
          <StatsCard
            label={t.cards.cancellationRate}
            value={data.cancellationRate.toFixed(1)}
            suffix="%"
            icon={XCircle}
            iconColor="text-red-400"
            iconBgColor="bg-red-500/10"
          />
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <BookingsChart
            data={data.bookingsByMonth}
            translations={{
              title: t.charts.bookingsTitle,
              bookings: t.charts.bookings,
              noData: t.charts.noData,
            }}
          />
          <TopServicesTable
            services={data.topServices}
            translations={{
              title: t.tables.topServicesTitle,
              service: t.tables.service,
              bookings: t.tables.bookingsCount,
              revenue: t.tables.revenue,
              noData: t.tables.noData,
            }}
          />
        </div>
      </section>

      {/* Clients Stats */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-white/80">Clients</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label={t.cards.totalClients}
            value={data.totalClients}
            evolution={data.clientsEvolution}
            evolutionLabel={t.cards.vsPreviousPeriod}
            icon={Users}
            iconColor="text-cyan-400"
            iconBgColor="bg-cyan-500/10"
          />
          <StatsCard
            label={t.cards.newClients}
            value={data.newClients}
            icon={UserPlus}
            iconColor="text-emerald-400"
            iconBgColor="bg-emerald-500/10"
          />
          <StatsCard
            label={t.cards.returnRate}
            value={data.returnRate.toFixed(1)}
            suffix="%"
            icon={RefreshCw}
            iconColor="text-amber-400"
            iconBgColor="bg-amber-500/10"
          />
        </div>
      </section>

      {/* Reviews Stats */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-white/80">Avis</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            label={t.cards.totalReviews}
            value={data.totalReviews}
            evolution={data.reviewsEvolution}
            evolutionLabel={t.cards.vsPreviousPeriod}
            icon={Star}
            iconColor="text-yellow-400"
            iconBgColor="bg-yellow-500/10"
          />
          <StatsCard
            label={t.cards.avgRating}
            value={data.averageRating.toFixed(1)}
            suffix="/5"
            icon={Star}
            iconColor="text-yellow-400"
            iconBgColor="bg-yellow-500/10"
          />
        </div>
        <div className="mt-6">
          <ReviewsChart
            data={data.reviewsByMonth}
            translations={{
              title: t.charts.reviewsTitle,
              reviews: t.charts.reviews,
              avgRating: t.charts.avgRating,
              noData: t.charts.noData,
            }}
          />
        </div>
      </section>
    </div>
  );
}
