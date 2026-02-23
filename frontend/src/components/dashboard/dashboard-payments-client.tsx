"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { toast } from "sonner";
import {
  centerApi,
  type PaymentResponse,
  type RevenueResponse,
  type CommissionResponse,
} from "@/lib/api";
import { CreditCard, TrendingUp, Receipt } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { PageSkeleton } from "@/components/admin/loading-skeleton";
import { StatusBadge } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { StatCard } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";

export function DashboardPaymentsClient() {
  const t = useTranslations("dashboard");
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [revenue, setRevenue] = useState<RevenueResponse | null>(null);
  const [commissions, setCommissions] = useState<CommissionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"payments" | "revenue" | "commissions">(
    "payments"
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, r, c] = await Promise.all([
        centerApi.getPayments(),
        centerApi.getRevenue(),
        centerApi.getCommissions(),
      ]);
      setPayments(p);
      setRevenue(r);
      setCommissions(c);
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const tabs = [
    { key: "payments" as const, label: t("payments"), icon: CreditCard },
    { key: "revenue" as const, label: t("revenue"), icon: TrendingUp },
    { key: "commissions" as const, label: t("commissions"), icon: Receipt },
  ];

  return (
    <div className="space-y-6">
      <PageHeader titleKey="payments" namespace="dashboard" />

      {/* Revenue summary */}
      {revenue && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            title={t("totalRevenue")}
            value={`${(parseFloat(String(revenue.net_revenue)) || 0).toFixed(2)} €`}
            description={`${revenue.transaction_count} ${t("transactions")}`}
          />
          <StatCard
            title={t("commissions")}
            value={`${(parseFloat(String(revenue.total_commission)) || 0).toFixed(2)} €`}
            description={`${commissions.length} ${t("commissions").toLowerCase()}`}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        {tabs.map((t_) => {
          const Icon = t_.icon;
          return (
            <Button
              key={t_.key}
              onClick={() => setTab(t_.key)}
              variant={tab === t_.key ? "default" : "ghost"}
              className={
                tab === t_.key
                  ? "bg-cyan-600 hover:bg-cyan-700 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }
            >
              <Icon className="h-4 w-4" />
              {t_.label}
            </Button>
          );
        })}
      </div>

      {loading ? (
        <PageSkeleton />
      ) : (
        <>
          {tab === "payments" && <PaymentsList payments={payments} />}
          {tab === "commissions" && (
            <CommissionsList commissions={commissions} />
          )}
          {tab === "revenue" && revenue && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-center">
                <p className="text-sm text-slate-400">{t("totalRevenue")}</p>
                <p className="mt-1 text-2xl font-bold text-emerald-400">
                  {(parseFloat(String(revenue.total_revenue)) || 0).toFixed(2)} {revenue.currency}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-center">
                <p className="text-sm text-slate-400">{t("netRevenue")}</p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {(parseFloat(String(revenue.net_revenue)) || 0).toFixed(2)} {revenue.currency}
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 text-center">
                <p className="text-sm text-slate-400">{t("commissions")}</p>
                <p className="mt-1 text-2xl font-bold text-amber-400">
                  {(parseFloat(String(revenue.total_commission)) || 0).toFixed(2)}{" "}
                  {revenue.currency}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PaymentsList({ payments }: { payments: PaymentResponse[] }) {
  const t = useTranslations("dashboard");
  const payFormat = useFormatter();

  if (payments.length === 0) {
    return <EmptyState icon={CreditCard} title={t("noBookings")} />;
  }

  return (
    <div className="space-y-3">
      {payments.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-4"
        >
          <div>
            <p className="text-sm font-medium">
              {(parseFloat(String(p.amount)) || 0).toFixed(2)} {p.currency}
            </p>
            <p className="text-xs text-slate-400">
              {payFormat.dateTime(new Date(p.created_at), {
                dateStyle: "medium",
              })}
            </p>
          </div>
          <StatusBadge status={p.status} />
        </div>
      ))}
    </div>
  );
}

function CommissionsList({
  commissions,
}: {
  commissions: CommissionResponse[];
}) {
  const comFormat = useFormatter();
  if (commissions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {commissions.map((c) => (
        <div
          key={c.id}
          className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 p-4"
        >
          <div>
            <p className="text-sm font-medium">
              {(parseFloat(String(c.commission_amount)) || 0).toFixed(2)} {c.currency}
            </p>
            <p className="text-xs text-slate-400">
              {comFormat.dateTime(new Date(c.created_at), {
                dateStyle: "medium",
              })}
            </p>
          </div>
          <StatusBadge status={c.status} />
        </div>
      ))}
    </div>
  );
}
