"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { RotateCcw, Check, X } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { TableSkeleton } from "@/components/admin/loading-skeleton";
import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";

interface AdminRefundData {
  id: string;
  booking_id: string;
  amount: number | string;
  currency: string;
  reason: string | null;
  status: string;
  created_at: string;
}

export function AdminRefundsClient(): React.JSX.Element {
  const t = useTranslations("admin");
  const format = useFormatter();
  const [refunds, setRefunds] = useState<AdminRefundData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const loadRefunds = useCallback(async () => {
    setLoading(true);
    try {
      const params = statusFilter ? { status: statusFilter } : undefined;
      const raw = await adminApi.getRefunds(params);
      const mapped: AdminRefundData[] = (raw as unknown as AdminRefundData[]).map((r) => ({
        id: r.id,
        booking_id: r.booking_id,
        amount: r.amount,
        currency: r.currency ?? "EUR",
        reason: r.reason ?? null,
        status: r.status,
        created_at: r.created_at,
      }));
      setRefunds(mapped);
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, t]);

  useEffect(() => {
    loadRefunds();
  }, [loadRefunds]);

  const formatCurrency = (amount: number | string, currency: string): string =>
    format.number(parseFloat(String(amount)) || 0, { style: "currency", currency });

  const formatDate = (dateString: string): string =>
    format.dateTime(new Date(dateString), {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleApprove = async (id: string): Promise<void> => {
    try {
      await adminApi.approveRefund(id);
      toast.success(t("saved"));
      loadRefunds();
    } catch {
      toast.error(t("saveError"));
    }
  };

  const handleReject = async (id: string): Promise<void> => {
    try {
      await adminApi.rejectRefund(id);
      toast.success(t("saved"));
      loadRefunds();
    } catch {
      toast.error(t("saveError"));
    }
  };

  const getStatusBadge = (status: string): string => {
    const styles: Record<string, string> = {
      approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      rejected: "bg-red-500/10 text-red-400 border-red-500/20",
    };
    return styles[status] ?? "bg-slate-700 text-slate-300 border-slate-600";
  };

  return (
    <div className="space-y-6">
      <PageHeader titleKey="refunds" />

      {/* Status Filter */}
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 transition-colors hover:border-slate-600 focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
        >
          <option value="">{t("all")}</option>
          <option value="pending">{t("pending")}</option>
          <option value="approved">{t("approved")}</option>
          <option value="rejected">{t("rejected")}</option>
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : refunds.length === 0 ? (
        <EmptyState icon={RotateCcw} title={t("noResults")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("bookingId")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("amount")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("reason")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("status")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("date")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {refunds.map((refund) => (
                <tr key={refund.id} className="transition-colors hover:bg-slate-800/50">
                  <td className="px-4 py-3 text-sm text-slate-300">
                    {refund.booking_id?.slice(0, 8) ?? "—"}...
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-slate-200">
                    {formatCurrency(refund.amount, refund.currency)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">
                    {refund.reason ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-1 text-xs font-medium ${getStatusBadge(refund.status)}`}>
                      {refund.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {formatDate(refund.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {refund.status === "pending" && (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          onClick={() => handleApprove(refund.id)}
                          variant="outline"
                          className="gap-1 border-emerald-500/30 px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-500/10"
                        >
                          <Check className="h-3.5 w-3.5" />
                          {t("approve")}
                        </Button>
                        <Button
                          onClick={() => handleReject(refund.id)}
                          variant="outline"
                          className="gap-1 border-red-500/30 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
                        >
                          <X className="h-3.5 w-3.5" />
                          {t("reject")}
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
