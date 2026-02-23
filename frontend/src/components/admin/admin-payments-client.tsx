"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { toast } from "sonner";
import { adminApi, type AdminPaymentFilters } from "@/lib/api";
import { Filter, CreditCard, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { StatCard } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AdminPaymentData {
  id: string;
  center_name: string | null;
  total_price: number | string;
  commission_amount: number | string;
  currency: string;
  status: string;
  booking_date: string;
  created_at: string;
}

export function AdminPaymentsClient() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const [payments, setPayments] = useState<AdminPaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const loadPayments = useCallback(async (filters: AdminPaymentFilters = {}) => {
    setLoading(true);
    try {
      const raw = await adminApi.getPayments(filters);
      const mapped: AdminPaymentData[] = (raw as unknown as AdminPaymentData[]).map((p) => ({
        id: p.id,
        center_name: p.center_name ?? null,
        total_price: p.total_price,
        commission_amount: p.commission_amount,
        currency: p.currency ?? "EUR",
        status: p.status,
        booking_date: p.booking_date,
        created_at: p.created_at,
      }));
      setPayments(mapped);
    } catch {
      toast.error(t("loadError") || tCommon("error"));
    } finally {
      setLoading(false);
    }
  }, [t, tCommon]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleFilter = () => {
    const filters: AdminPaymentFilters = {};
    if (statusFilter !== "all") {
      filters.status = statusFilter;
    }
    if (dateFrom) {
      filters.date_from = dateFrom;
    }
    if (dateTo) {
      filters.date_to = dateTo;
    }
    loadPayments(filters);
  };

  const formatAmount = (value: number | string, currency?: string): string => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "—";
    return format.number(num, {
      style: "currency",
      currency: currency ?? "EUR",
    });
  };

  const formatDate = (dateString: string): string =>
    format.dateTime(new Date(dateString), {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const totalAmount = payments.reduce(
    (sum, p) => sum + (parseFloat(String(p.total_price)) || 0),
    0
  );
  const totalCommission = payments.reduce(
    (sum, p) => sum + (parseFloat(String(p.commission_amount)) || 0),
    0
  );
  const pendingAmount = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + (parseFloat(String(p.total_price)) || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader titleKey="payments" />

      {/* Filter Bar */}
      <div className="flex flex-col gap-4 rounded-lg border border-slate-800 bg-slate-900/50 p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-xs text-slate-400">{t("status")}</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-white focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          >
            <option value="all">{t("all")}</option>
            <option value="pending">{t("pending")}</option>
            <option value="completed">{t("completed")}</option>
            <option value="confirmed">{t("confirmed")}</option>
            <option value="cancelled">{t("cancelled")}</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs text-slate-400">
            {t("dateFrom")}
          </label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500/50 focus-visible:border-cyan-500"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs text-slate-400">
            {t("dateTo")}
          </label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border-slate-700 bg-slate-800/50 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500/50 focus-visible:border-cyan-500"
          />
        </div>
        <Button
          type="button"
          onClick={handleFilter}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <Filter className="h-4 w-4" />
          {t("filter")}
        </Button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("totalPayments")}
          value={payments.length.toString()}
        />
        <StatCard
          title={t("totalAmount")}
          value={formatAmount(totalAmount)}
        />
        <StatCard
          title={t("totalCommissions")}
          value={formatAmount(totalCommission)}
        />
        <StatCard
          title={t("pendingAmount")}
          value={formatAmount(pendingAmount)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center gap-3 py-16">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
          <span className="text-slate-400">{tCommon("loading")}</span>
        </div>
      ) : payments.length === 0 ? (
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-16 text-center">
          <CreditCard className="mx-auto h-12 w-12 text-slate-500" />
          <p className="mt-4 text-slate-400">{t("emptyState")}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full">
            <thead className="border-b border-slate-800 bg-slate-900/80">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                  {t("id")}
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                  {t("center")}
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                  {t("totalPrice")}
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                  {t("commissionAmount")}
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                  {t("status")}
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                  {t("date")}
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr
                  key={payment.id}
                  className="border-b border-slate-800 bg-slate-900/30 hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">
                    {payment.id?.slice(0, 8) ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {payment.center_name ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-white font-medium">
                    {formatAmount(payment.total_price, payment.currency)}
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {formatAmount(payment.commission_amount, payment.currency)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={payment.status} />
                  </td>
                  <td className="px-6 py-4 text-slate-400">{formatDate(payment.booking_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
