"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { TableSkeleton } from "@/components/admin/loading-skeleton";
import { EmptyState } from "@/components/admin/empty-state";
import { ConfirmDialog, useConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AdminServiceRow {
  id: string;
  name: string;
  category: string | null;
  center_name: string | null;
  price: string;
  currency: string;
  is_active: boolean;
  created_at: string;
}

export function AdminServicesClient() {
  const t = useTranslations("admin");
  const intlFormat = useFormatter();
  const confirmDialog = useConfirmDialog();
  const [services, setServices] = useState<AdminServiceRow[]>([]);
  const [filteredServices, setFilteredServices] = useState<AdminServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadServices = useCallback(() => {
    setLoading(true);
    setError(null);
    adminApi
      .getServices()
      .then((data) => {
        const rows: AdminServiceRow[] = (data as unknown as AdminServiceRow[]).map((s) => ({
          id: s.id,
          name: s.name ?? "",
          category: s.category ?? null,
          center_name: s.center_name ?? null,
          price: String(s.price ?? "0"),
          currency: s.currency ?? "EUR",
          is_active: s.is_active ?? true,
          created_at: s.created_at ?? "",
        }));
        setServices(rows);
        setFilteredServices(rows);
      })
      .catch(() => {
        const errorMessage = t("loadError");
        setError(errorMessage);
        toast.error(errorMessage);
      })
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredServices(services);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = services.filter((service) =>
      service.name.toLowerCase().includes(query)
    );
    setFilteredServices(filtered);
  }, [searchQuery, services]);

  const handleDelete = useCallback(
    async (id: string) => {
      confirmDialog.confirm({
        title: t("confirmDelete"),
        description: t("confirmDeleteService"),
        onConfirm: async () => {
          setDeletingId(id);
          try {
            await adminApi.deleteService(id);
            toast.success(t("serviceDeleted"));
            loadServices();
          } catch {
            toast.error(t("saveError"));
          } finally {
            setDeletingId(null);
          }
        },
      });
    },
    [t, loadServices, confirmDialog]
  );

  const formatDate = (dateString: string): string => {
    if (!dateString) return "—";
    return intlFormat.dateTime(new Date(dateString), {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatPrice = (priceStr: string, currency: string): string => {
    const value = parseFloat(priceStr);
    if (isNaN(value)) return "—";
    return intlFormat.number(value, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    });
  };

  if (loading) {
    return <TableSkeleton rows={5} cols={7} />;
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-500/20 px-4 py-3 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader titleKey="services">
        <Input
          type="search"
          placeholder={t("search")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-auto"
        />
      </PageHeader>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={confirmDialog.onOpenChange}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={t("delete")}
        cancelLabel={t("close")}
        variant="destructive"
        onConfirm={confirmDialog.onConfirm}
      />

      <div className="overflow-hidden rounded-xl border border-slate-800">
        <table className="w-full">
          <thead className="border-b border-slate-800 bg-slate-900/80">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                {t("name")}
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                {t("category")}
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                {t("center")}
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                {t("price")}
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                {t("active")}
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                {t("createdAt")}
              </th>
              <th className="px-6 py-4 text-right text-sm font-medium text-slate-300">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredServices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16">
                  <EmptyState title={t("noResults")} />
                </td>
              </tr>
            ) : (
              filteredServices.map((service) => (
                <tr
                  key={service.id}
                  className="border-b border-slate-800 bg-slate-900/30 hover:bg-slate-800/50"
                >
                  <td className="px-6 py-4 text-white">{service.name}</td>
                  <td className="px-6 py-4 text-slate-300">
                    {service.category ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {service.center_name ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {formatPrice(service.price, service.currency)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        service.is_active
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {service.is_active ? t("active") : t("inactive")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {formatDate(service.created_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      onClick={() => handleDelete(service.id)}
                      disabled={deletingId === service.id}
                      variant="ghost"
                      size="icon-sm"
                      className="text-red-400 hover:text-red-300"
                      title={t("delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
