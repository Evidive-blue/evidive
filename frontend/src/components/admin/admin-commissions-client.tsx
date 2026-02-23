"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { toast } from "sonner";
import {
  adminApi,
  type CommissionResponse,
  type AdminCommissionConfig,
} from "@/lib/api";
import { ChevronDown, Download } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { PageSkeleton } from "@/components/admin/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const COMMISSION_CSV_HEADERS = [
  "id",
  "center_name",
  "total_price",
  "commission_amount",
  "currency",
  "status",
  "booking_date",
  "created_at",
] as const;

function escapeCsv(val: string | number | null): string {
  const s = String(val ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function commissionsToCsvRows(commissions: CommissionResponse[]): string[] {
  return commissions.map((c) =>
    [
      escapeCsv(c.id),
      escapeCsv(c.center_name),
      escapeCsv(c.total_price),
      escapeCsv(c.commission_amount),
      escapeCsv(c.currency),
      escapeCsv(c.status),
      escapeCsv(c.booking_date),
      escapeCsv(c.created_at),
    ].join(",")
  );
}

function downloadCsv(commissions: CommissionResponse[], filename: string) {
  const header = COMMISSION_CSV_HEADERS.join(",");
  const rows = commissionsToCsvRows(commissions);
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminCommissionsClient() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const [config, setConfig] = useState<AdminCommissionConfig | null>(null);
  const [commissions, setCommissions] = useState<CommissionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [defaultRate, setDefaultRate] = useState<string>("");
  const [savingConfig, setSavingConfig] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDropdownOpen, setBulkDropdownOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [configData, commissionsData] = await Promise.all([
        adminApi.getCommissionConfig(),
        adminApi.getCommissions(),
      ]);
      setConfig(configData);
      setDefaultRate(configData.default_rate.toString());
      setCommissions(commissionsData);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveConfig = async () => {
    const rate = parseFloat(defaultRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error(t("invalidCommissionRate"));
      return;
    }

    if (!config) {
      return;
    }

    setSavingConfig(true);
    try {
      await adminApi.updateCommissionConfig({
        ...config,
        default_rate: rate,
      });
      toast.success(t("configUpdated"));
      load();
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setSavingConfig(false);
    }
  };

  const handleExportCsv = useCallback(() => {
    downloadCsv(
      commissions,
      `commissions-${new Date().toISOString().slice(0, 10)}.csv`
    );
    toast.success(tCommon("success"));
  }, [commissions, tCommon]);

  const allSelected =
    commissions.length > 0 && selectedIds.size === commissions.length;
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(commissions.map((c) => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkMarkAsPaid = async () => {
    if (selectedIds.size === 0) {
      return;
    }
    setBulkLoading(true);
    try {
      if (selectedIds.size === 1) {
        const firstId = [...selectedIds][0];
        if (!firstId) {
          return;
        }
        await adminApi.markCommissionPaid(firstId);
        toast.success(t("commissionPaid"));
      } else {
        await adminApi.markCommissionsPaidBulk([...selectedIds]);
        toast.success(t("commissionsBulkPaid"));
      }
      setSelectedIds(new Set());
      setBulkDropdownOpen(false);
      load();
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkExportSelected = () => {
    const selected = commissions.filter((c) => selectedIds.has(c.id));
    if (selected.length === 0) {
      return;
    }
    downloadCsv(
      selected,
      `commissions-selected-${new Date().toISOString().slice(0, 10)}.csv`
    );
    toast.success(tCommon("success"));
    setBulkDropdownOpen(false);
  };

  const formatCurrency = (amount: number | string): string =>
    format.number(parseFloat(String(amount)) || 0, {
      style: "currency",
      currency: "EUR",
    });

  const formatDate = (d: string): string =>
    format.dateTime(new Date(d), {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return <PageSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-500/20 px-4 py-3 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader titleKey="commissions" />

      {/* Commission Configuration Section */}
      <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/30 p-6">
        <h3 className="text-lg font-semibold text-white">
          {t("commissionConfiguration")}
        </h3>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              {t("defaultCommissionRate")}
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={defaultRate}
                onChange={(e) => setDefaultRate(e.target.value)}
                className="w-32"
              />
              <span className="text-slate-400">%</span>
            </div>
          </div>
          <Button
            type="button"
            onClick={handleSaveConfig}
            disabled={savingConfig}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {savingConfig ? "…" : t("save")}
          </Button>
        </div>
      </div>

      {/* Commission History Section */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-white">
            {t("commissionHistory")}
          </h3>
          <div className="flex items-center gap-2">
            {someSelected && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setBulkDropdownOpen((o) => !o)}
                  disabled={bulkLoading}
                  className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  {t("bulkActions")}
                  <ChevronDown className="h-4 w-4" />
                </button>
                {bulkDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      aria-hidden
                      onClick={() => setBulkDropdownOpen(false)}
                    />
                    <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-lg">
                      <button
                        type="button"
                        onClick={handleBulkMarkAsPaid}
                        disabled={bulkLoading}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-white hover:bg-slate-700 disabled:opacity-50"
                      >
                        {t("markAsPaid")}
                      </button>
                      <button
                        type="button"
                        onClick={handleBulkExportSelected}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-white hover:bg-slate-700"
                      >
                        {t("exportSelected")}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={commissions.length === 0}
              className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {t("exportCsv")}
            </button>
          </div>
        </div>
        {someSelected && (
          <p className="text-sm text-slate-400">
            {t("selectedCount", { count: selectedIds.size })}
          </p>
        )}
        <div className="overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full">
            <thead className="border-b border-slate-800 bg-slate-900/80">
              <tr>
                <th className="w-12 px-4 py-4">
                  <label className="flex cursor-pointer items-center justify-center">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      aria-label={
                        allSelected ? t("deselectAll") : t("selectAll")
                      }
                      className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-cyan-600 focus-visible:ring-2 focus-visible:ring-cyan-500"
                    />
                  </label>
                </th>
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
              {commissions.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-16 text-center text-slate-400"
                  >
                    {t("emptyState")}
                  </td>
                </tr>
              ) : (
                commissions.map((commission) => (
                  <tr
                    key={commission.id}
                    className="border-b border-slate-800 bg-slate-900/30 hover:bg-slate-800/50"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(commission.id)}
                        onChange={() => toggleSelect(commission.id)}
                        className="rounded border-slate-600 bg-slate-800 text-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500"
                      />
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {commission.id?.slice(0, 8) ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {commission.center_name ?? "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {formatCurrency(commission.total_price)}
                    </td>
                    <td className="px-6 py-4 text-white">
                      {formatCurrency(commission.commission_amount)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={commission.status} />
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {formatDate(commission.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
