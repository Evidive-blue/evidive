"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { toast } from "sonner";
import {
  centerApi,
  type PaymentResponse,
  type RevenueResponse,
  type StripePayoutConfig,
} from "@/lib/api";
import { PageHeader } from "@/components/admin/page-header";
import { PageSkeleton } from "@/components/admin/loading-skeleton";
import { StatusBadge } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { StatCard } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard } from "lucide-react";

export function DashboardRevenueClient() {
  const t = useTranslations("dashboard");
  const format = useFormatter();
  const [revenue, setRevenue] = useState<RevenueResponse | null>(null);
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [stripeConfig, setStripeConfig] = useState<StripePayoutConfig | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, p, sc] = await Promise.all([
        centerApi.getRevenue(),
        centerApi.getPayments(),
        centerApi.getStripeConfig(),
      ]);
      setRevenue(r);
      setPayments(p);
      setStripeConfig(sc);
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleConnectStripe = useCallback(async () => {
    try {
      const { url } = await centerApi.connectStripe();
      window.location.href = url;
    } catch {
      toast.error(t("loadError"));
    }
  }, [t]);

  const formatCurrency = (amount: number | string, currency: string): string =>
    format.number(parseFloat(String(amount)) || 0, {
      style: "currency",
      currency,
    });

  if (loading) {
    return <PageSkeleton />;
  }

  const isStripeConnected = stripeConfig?.stripe_onboarding_complete === true;

  return (
    <div className="space-y-8">
      <PageHeader titleKey="revenue" namespace="dashboard" />

      {/* Revenue Overview */}
      {revenue && (
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-slate-300">
            {t("revenueOverview")}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title={t("totalRevenueAmount")}
              value={formatCurrency(revenue.total_revenue, revenue.currency)}
            />
            <StatCard
              title={t("netRevenue")}
              value={formatCurrency(revenue.net_revenue, revenue.currency)}
            />
            <StatCard
              title={t("commissions")}
              value={formatCurrency(revenue.total_commission, revenue.currency)}
            />
            <StatCard
              title={t("transactions")}
              value={String(revenue.transaction_count)}
            />
          </div>
        </section>
      )}

      {/* Stripe Configuration */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-slate-300">
          {t("stripeConfiguration")}
        </h3>
        <div className="rounded-xl border border-slate-700/80 bg-slate-900/95 p-6">
          {!isStripeConnected ? (
            <div className="flex flex-col items-start gap-4">
              <p className="text-slate-400">{t("stripeNotConnected")}</p>
              <Button
                type="button"
                onClick={handleConnectStripe}
                className="bg-cyan-600 text-white hover:bg-cyan-700"
              >
                {t("connectStripe")}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-emerald-400">{t("stripeConnected")}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">
                    {t("stripeAccountId")}
                  </label>
                  <Input
                    type="text"
                    readOnly
                    value={stripeConfig?.stripe_account_id ?? ""}
                    className="border-slate-700 bg-slate-800/50 text-slate-300"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">
                    {t("currency")}
                  </label>
                  <Input
                    type="text"
                    readOnly
                    value={stripeConfig?.currency ?? "EUR"}
                    className="border-slate-700 bg-slate-800/50 text-slate-300"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Recent Payments */}
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-slate-300">
          {t("recentPayments")}
        </h3>
        <div className="overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-900/95">
          {payments.length === 0 ? (
            <EmptyState icon={CreditCard} title={t("noBookings")} />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-4 py-3 text-left font-medium text-slate-400">
                    {t("paymentId")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-400">
                    {t("bookingId")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-400">
                    {t("paymentAmount")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-400">
                    {t("paymentStatus")}
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-slate-400">
                    {t("paymentDate")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-slate-800 last:border-0"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-200">
                      {p.id?.slice(0, 8) ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">
                      {p.booking_id?.slice(0, 8) ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-emerald-400">
                      {formatCurrency(p.amount, p.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {format.dateTime(new Date(p.created_at), {
                        dateStyle: "medium",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
