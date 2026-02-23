"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { adminApi, type ServiceExtraResponse, type CreateServiceExtraRequest } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { TableSkeleton } from "@/components/admin/loading-skeleton";
import { EmptyState } from "@/components/admin/empty-state";
import { ConfirmDialog, useConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";

const emptyForm: CreateServiceExtraRequest = {
  name: "",
  price: 0,
  description: "",
  is_active: true,
};

export function AdminExtrasClient(): React.JSX.Element {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const intlFormat = useFormatter();
  const confirmDialog = useConfirmDialog();

  const formatPrice = (price: number | string, currency = "EUR"): string =>
    intlFormat.number(parseFloat(String(price)) || 0, { style: "currency", currency });

  const [extras, setExtras] = useState<ServiceExtraResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState<CreateServiceExtraRequest>({ ...emptyForm });

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    adminApi
      .getExtras()
      .then((extrasData) => {
        setExtras(extrasData);
      })
      .catch(() => {
        const errorMessage = t("loadError");
        setError(errorMessage);
        toast.error(errorMessage);
      })
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = useCallback(() => {
    setForm({ ...emptyForm });
    setShowAddForm(false);
    setEditingId(null);
  }, []);

  const handleCreate = async (): Promise<void> => {
    if (!form.name.trim()) {
      toast.error(t("nameRequired"));
      return;
    }
    try {
      const body: CreateServiceExtraRequest = {
        name: form.name.trim(),
        price: Number(form.price) || 0,
        description: form.description?.trim() || undefined,
        is_active: form.is_active ?? true,
      };
      await adminApi.createExtra(body);
      toast.success(t("extraCreated"));
      resetForm();
      loadData();
    } catch {
      toast.error(t("saveError"));
    }
  };

  const handleStartEdit = (extra: ServiceExtraResponse): void => {
    setEditingId(extra.id);
    setForm({
      name: extra.name,
      price: parseFloat(String(extra.price)) || 0,
      description: extra.description ?? "",
      is_active: extra.is_active,
    });
  };

  const handleCancelEdit = (): void => {
    setEditingId(null);
    setForm({ ...emptyForm });
  };

  const handleUpdate = async (id: string): Promise<void> => {
    if (!form.name.trim()) {
      toast.error(t("nameRequired"));
      return;
    }
    try {
      const body: Partial<CreateServiceExtraRequest> = {
        name: form.name.trim(),
        price: Number(form.price) || 0,
        description: form.description?.trim() || undefined,
        is_active: form.is_active,
      };
      await adminApi.updateExtra(id, body);
      toast.success(t("extraUpdated"));
      handleCancelEdit();
      loadData();
    } catch {
      toast.error(t("saveError"));
    }
  };

  const handleDelete = (id: string): void => {
    confirmDialog.confirm({
      title: t("confirmDelete"),
      description: t("confirmDeleteExtra"),
      onConfirm: async () => {
        setDeletingId(id);
        try {
          await adminApi.deleteExtra(id);
          toast.success(t("extraDeleted"));
          loadData();
        } catch {
          toast.error(t("saveError"));
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  if (loading) {
    return <TableSkeleton rows={5} cols={5} />;
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-500/20 px-4 py-3 text-red-400">
        {error}
      </div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500";

  return (
    <div className="space-y-6">
      <PageHeader titleKey="extras">
        <Button
          onClick={() => {
            setShowAddForm(true);
            setForm({ ...emptyForm });
          }}
          className="bg-cyan-600 text-white hover:bg-cyan-700"
        >
          <Plus className="h-4 w-4" />
          {t("addExtra")}
        </Button>
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

      {/* Add / Edit form */}
      {(showAddForm || editingId) && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 dark:bg-slate-800">
          <h3 className="mb-4 text-sm font-semibold text-slate-200">
            {editingId ? t("edit") : t("addExtra")}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-slate-400">
                {t("extraName")}
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={inputClass}
                placeholder={t("extraName")}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">
                {t("extraPrice")}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))
                }
                className={inputClass}
                placeholder="0.00"
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm text-slate-400">
                {t("extraDescription")}
              </label>
              <textarea
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
                className={inputClass}
                placeholder={t("extraDescription")}
              />
            </div>
            <div className="flex items-center gap-6 md:col-span-2">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_active ?? true}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, is_active: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-cyan-600 focus-visible:ring-2 focus-visible:ring-cyan-500"
                />
                <span className="text-sm text-slate-300">
                  {t("active")}
                </span>
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              onClick={() =>
                editingId ? handleUpdate(editingId) : handleCreate()
              }
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <Save className="h-4 w-4" />
              {t("save")}
            </Button>
            <Button
              onClick={() =>
                editingId ? handleCancelEdit() : resetForm()
              }
              variant="outline"
            >
              <X className="h-4 w-4" />
              {tCommon("cancel")}
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800">
        <table className="w-full">
          <thead className="border-b border-slate-800 bg-slate-900/80">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                {t("name")}
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                {t("price")}
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                {t("description")}
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                {t("status")}
              </th>
              <th className="px-6 py-4 text-right text-sm font-medium text-slate-300">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {extras.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16">
                  <EmptyState title={t("noResults")} />
                </td>
              </tr>
            ) : (
              extras.map((extra) => (
                <tr
                  key={extra.id}
                  className="border-b border-slate-800 bg-slate-900/30 transition-colors hover:bg-slate-800/50"
                >
                  <td className="px-6 py-4 text-slate-200">{extra.name}</td>
                  <td className="px-6 py-4 text-slate-300">
                    {formatPrice(extra.price, extra.currency)}
                  </td>
                  <td className="max-w-[200px] truncate px-6 py-4 text-slate-400">
                    {extra.description || "\u2014"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        extra.is_active
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-slate-600/50 text-slate-400"
                      }`}
                    >
                      {extra.is_active ? t("active") : t("inactive")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        onClick={() => handleStartEdit(extra)}
                        variant="ghost"
                        size="icon-sm"
                        className="text-slate-400 hover:text-white"
                        aria-label={t("edit")}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(extra.id)}
                        disabled={deletingId === extra.id}
                        variant="ghost"
                        size="icon-sm"
                        className="text-red-400 hover:text-red-300"
                        aria-label={t("delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
