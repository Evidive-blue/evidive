"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { toast } from "sonner";
import { centerApi, type CommissionResponse } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/admin/page-header";
import { TableSkeleton } from "@/components/admin/loading-skeleton";
import { StatusBadge } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { StatCard } from "@/components/admin/stat-card";
import { Receipt } from "lucide-react";

export function DashboardCommissionsClient() {
  const t = useTranslations("dashboard");
  const format = useFormatter();
  const [commissions, setCommissions] = useState<CommissionResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await centerApi.getCommissions();
      setCommissions(data);
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const total = commissions.reduce((sum, c) => sum + (parseFloat(String(c.commission_amount)) || 0), 0);
  const pending = commissions
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + (parseFloat(String(c.commission_amount)) || 0), 0);
  const paid = commissions
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + (parseFloat(String(c.commission_amount)) || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader titleKey="commissions" namespace="dashboard" />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title={t("totalCommissions")}
          value={format.number(parseFloat(String(total)) || 0, {
            style: "currency",
            currency: "EUR",
          })}
        />
        <StatCard
          title={t("pendingCommissions")}
          value={format.number(parseFloat(String(pending)) || 0, {
            style: "currency",
            currency: "EUR",
          })}
        />
        <StatCard
          title={t("paidCommissions")}
          value={format.number(parseFloat(String(paid)) || 0, {
            style: "currency",
            currency: "EUR",
          })}
        />
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : commissions.length === 0 ? (
        <EmptyState icon={Receipt} title={t("noCommissions")} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/95">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">
                  {t("bookingId")}
                </TableHead>
                <TableHead className="text-slate-400">
                  {t("commissionAmount")}
                </TableHead>
                <TableHead className="text-slate-400">
                  {t("commissionRate")}
                </TableHead>
                <TableHead className="text-slate-400">
                  {t("commissionStatus")}
                </TableHead>
                <TableHead className="text-slate-400">{t("date")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions.map((c) => (
                <TableRow
                  key={c.id}
                  className="border-slate-800 text-slate-200 hover:bg-slate-800/50"
                >
                  <TableCell className="font-mono text-sm text-slate-300">
                    {c.id?.slice(0, 8) ?? "—"}
                  </TableCell>
                  <TableCell>
                    {format.number(parseFloat(String(c.commission_amount)) || 0, {
                      style: "currency",
                      currency: c.currency ?? "EUR",
                    })}
                  </TableCell>
                  <TableCell>
                    {format.number(parseFloat(String(c.total_price)) || 0, {
                      style: "currency",
                      currency: c.currency ?? "EUR",
                    })}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={c.status}
                      label={c.status === "paid" ? t("paid") : c.status}
                    />
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {format.dateTime(new Date(c.created_at), {
                      dateStyle: "medium",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
