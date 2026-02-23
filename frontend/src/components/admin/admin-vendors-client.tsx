"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { toast } from "sonner";
import { adminApi, type VendorResponse } from "@/lib/api";
import { Store, Ban, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { TableSkeleton } from "@/components/admin/loading-skeleton";
import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";

export function AdminVendorsClient(): React.JSX.Element {
  const t = useTranslations("admin");
  const format = useFormatter();
  const [vendors, setVendors] = useState<VendorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState<string>("");

  const loadVendors = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getVendors();
      setVendors(data);
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const formatCurrency = (decimalStr: string): string => {
    const value = parseFloat(decimalStr);
    if (isNaN(value)) return "—";
    return format.number(value, { style: "currency", currency: "EUR" });
  };

  const handleStartEdit = (vendor: VendorResponse): void => {
    setEditingId(vendor.id);
    setEditRate(String(vendor.commission_rate ?? 0));
  };

  const handleSaveRate = async (id: string): Promise<void> => {
    const rate = parseInt(editRate, 10);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error(t("invalidCommissionRate"));
      return;
    }
    try {
      await adminApi.updateVendorCommission(id, rate);
      toast.success(t("saved"));
      setEditingId(null);
      loadVendors();
    } catch {
      toast.error(t("saveError"));
    }
  };

  const handleSuspend = async (id: string): Promise<void> => {
    try {
      await adminApi.suspendVendor(id);
      toast.success(t("saved"));
      loadVendors();
    } catch {
      toast.error(t("saveError"));
    }
  };

  const handleActivate = async (id: string): Promise<void> => {
    try {
      await adminApi.activateVendor(id);
      toast.success(t("saved"));
      loadVendors();
    } catch {
      toast.error(t("saveError"));
    }
  };

  const getStatusBadge = (status: string): string => {
    const styles: Record<string, string> = {
      approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      suspended: "bg-red-500/10 text-red-400 border-red-500/20",
      pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    };
    return styles[status] ?? "bg-slate-700 text-slate-300 border-slate-600";
  };

  return (
    <div className="space-y-6">
      <PageHeader titleKey="vendors" />

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : vendors.length === 0 ? (
        <EmptyState icon={Store} title={t("noResults")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("name")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("location")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("status")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("commissionRate")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("revenue")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="transition-colors hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-slate-200">
                      {vendor.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {vendor.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {[vendor.city, vendor.country].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-1 text-xs font-medium ${getStatusBadge(vendor.status)}`}>
                      {vendor.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === vendor.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          value={editRate}
                          onChange={(e) => setEditRate(e.target.value)}
                          className="w-20 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-right text-sm text-slate-200 focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                        />
                        <Button
                          onClick={() => handleSaveRate(vendor.id)}
                          className="bg-cyan-600 px-2 py-1 text-xs text-white hover:bg-cyan-700"
                        >
                          {t("save")}
                        </Button>
                        <Button
                          onClick={() => setEditingId(null)}
                          variant="outline"
                          className="px-2 py-1 text-xs"
                        >
                          {t("cancel")}
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(vendor)}
                        className="text-sm text-slate-300 underline decoration-dotted underline-offset-4 transition-colors hover:text-cyan-400"
                      >
                        {vendor.commission_rate != null ? `${vendor.commission_rate}%` : "—"}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-slate-300">
                    {formatCurrency(vendor.total_revenue)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {vendor.status === "suspended" ? (
                        <Button
                          onClick={() => handleActivate(vendor.id)}
                          variant="outline"
                          className="gap-1 border-emerald-500/30 px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-500/10"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {t("activate")}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleSuspend(vendor.id)}
                          variant="outline"
                          className="gap-1 border-red-500/30 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10"
                        >
                          <Ban className="h-3.5 w-3.5" />
                          {t("suspend")}
                        </Button>
                      )}
                    </div>
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
