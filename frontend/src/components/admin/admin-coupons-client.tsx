"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { toast } from "sonner";
import {
  adminApi,
  type CouponResponse,
  type CouponSourceResponse,
  type CreateCouponRequest,
} from "@/lib/api";
import { Plus, Pencil, Trash2, Save, X, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { TableSkeleton } from "@/components/admin/loading-skeleton";
import { EmptyState } from "@/components/admin/empty-state";
import { ConfirmDialog, useConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";

type FilterTab = "all" | "active" | "expired";
type SectionTab = "coupons" | "sources";

function isExpired(coupon: CouponResponse): boolean {
  if (!coupon.expires_at) {return false;}
  return new Date(coupon.expires_at) <= new Date();
}

function isActiveCoupon(coupon: CouponResponse): boolean {
  if (!coupon.is_active) {return false;}
  return !isExpired(coupon);
}

export function AdminCouponsClient() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const confirmDialog = useConfirmDialog();
  const [sectionTab, setSectionTab] = useState<SectionTab>("coupons");
  const [coupons, setCoupons] = useState<CouponResponse[]>([]);
  const [filteredCoupons, setFilteredCoupons] = useState<CouponResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [form, setForm] = useState<CreateCouponRequest>({
    code: "",
    discount_type: "percent",
    discount_value: 0,
    max_uses: undefined,
    expires_at: undefined,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getCoupons();
      setCoupons(data);
    } catch {
      setError(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    switch (filterTab) {
      case "active":
        setFilteredCoupons(coupons.filter(isActiveCoupon));
        break;
      case "expired":
        setFilteredCoupons(coupons.filter(isExpired));
        break;
      default:
        setFilteredCoupons(coupons);
    }
  }, [filterTab, coupons]);

  const formatValue = (coupon: CouponResponse) => {
    if (coupon.discount_type === "percent") {
      return `${coupon.discount_value}%`;
    }
    return format.number(coupon.discount_value, {
      style: "currency",
      currency: coupon.currency ?? "EUR",
      minimumFractionDigits: 2,
    });
  };

  const getStatusBadge = (coupon: CouponResponse) => {
    const base = "rounded-full px-2 py-0.5 text-xs font-medium";
    if (isExpired(coupon)) {
      return `${base} bg-red-500/20 text-red-400`;
    }
    if (coupon.is_active) {
      return `${base} bg-emerald-500/20 text-emerald-400`;
    }
    return `${base} bg-slate-500/20 text-slate-400`;
  };

  const getStatusLabel = (coupon: CouponResponse) => {
    if (isExpired(coupon)) {return t("expired");}
    if (coupon.is_active) {return t("active");}
    return t("inactive");
  };

  const getTypeBadge = (discountType: "percent" | "fixed") => {
    const base = "rounded-full px-2 py-0.5 text-xs font-medium";
    if (discountType === "percent") {
      return `${base} bg-cyan-500/20 text-cyan-400`;
    }
    return `${base} bg-amber-500/20 text-amber-400`;
  };

  const resetForm = () => {
    setForm({
      code: "",
      discount_type: "percent",
      discount_value: 0,
      max_uses: undefined,
      expires_at: undefined,
    });
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!form.code.trim()) {
      toast.error(t("couponCodeRequired"));
      return;
    }
    if (form.discount_type === "percent" && (form.discount_value < 0 || form.discount_value > 100)) {
      toast.error(t("invalidCommissionRate"));
      return;
    }
    if (form.discount_type === "fixed" && form.discount_value < 0) {
      toast.error(t("couponValueInvalid"));
      return;
    }
    setSavingId("create");
    try {
      const expiresAt = form.expires_at
        ? `${form.expires_at}T23:59:59Z`
        : undefined;
      await adminApi.createCoupon({
        code: form.code.toUpperCase().trim(),
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        max_uses: form.max_uses ?? undefined,
        expires_at: expiresAt,
      });
      toast.success(t("couponCreated"));
      resetForm();
      load();
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setSavingId(null);
    }
  };

  const handleEdit = (coupon: CouponResponse) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      max_uses: coupon.max_uses,
      expires_at: coupon.expires_at
        ? coupon.expires_at.slice(0, 10)
        : undefined,
    });
  };

  const handleUpdate = async () => {
    if (!editingId) {return;}
    if (!form.code.trim()) {
      toast.error(t("couponCodeRequired"));
      return;
    }
    if (form.discount_type === "percent" && (form.discount_value < 0 || form.discount_value > 100)) {
      toast.error(t("invalidCommissionRate"));
      return;
    }
    setSavingId(editingId);
    try {
      const expiresAt = form.expires_at
        ? (form.expires_at.length === 10
            ? `${form.expires_at}T23:59:59Z`
            : form.expires_at)
        : undefined;
      await adminApi.updateCoupon(editingId, {
        code: form.code.toUpperCase().trim(),
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        max_uses: form.max_uses ?? undefined,
        expires_at: expiresAt,
      });
      toast.success(t("couponUpdated"));
      resetForm();
      load();
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    confirmDialog.confirm({
      title: t("confirmDelete"),
      description: t("confirmDeleteCoupon"),
      onConfirm: async () => {
        setDeletingId(id);
        try {
          await adminApi.deleteCoupon(id);
          toast.success(t("couponDeleted"));
          load();
        } catch {
          toast.error(tCommon("error"));
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const inputClass =
    "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500";

  if (loading) {
    return <TableSkeleton rows={5} cols={8} />;
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
      <PageHeader titleKey="coupons">
        {sectionTab === "coupons" && (
          <Button
            onClick={() => {
              resetForm();
              setShowAddForm(!showAddForm);
            }}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <Plus className="h-4 w-4" />
            {t("addCoupon")}
          </Button>
        )}
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

      {/* Section tabs: Coupons vs Sources */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setSectionTab("coupons")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            sectionTab === "coupons"
              ? "bg-cyan-600 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          {t("coupons")}
        </button>
        <button
          type="button"
          onClick={() => setSectionTab("sources")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            sectionTab === "sources"
              ? "bg-cyan-600 text-white"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          {t("couponSources")}
        </button>
      </div>

      {sectionTab === "sources" && <SourcesSection />}

      {sectionTab === "coupons" && (
      <>
      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "active", "expired"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilterTab(tab)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filterTab === tab
                ? "bg-cyan-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {tab === "all"
              ? t("allCoupons")
              : tab === "active"
                ? t("activeCoupons")
                : t("expiredCoupons")}
          </button>
        ))}
      </div>

      {/* Add / Edit form */}
      {(showAddForm || editingId) && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/95 p-4">
          <h3 className="mb-4 text-lg font-medium text-slate-200">
            {editingId ? t("edit") : t("addCoupon")}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-slate-400">
                {t("couponCode")}
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                }
                className={inputClass}
                placeholder={t("couponCodeExample")}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">
                {t("couponType")}
              </label>
              <select
                value={form.discount_type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    discount_type: e.target.value as "percent" | "fixed",
                  }))
                }
                className={inputClass}
              >
                <option value="percent">{t("percentage")}</option>
                <option value="fixed">{t("fixedAmount")}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">
                {t("couponValue")}
              </label>
              <input
                type="number"
                min="0"
                max={form.discount_type === "percent" ? 100 : undefined}
                step={form.discount_type === "percent" ? 1 : 0.01}
                value={form.discount_value || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    discount_value: parseFloat(e.target.value) || 0,
                  }))
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">
                {t("couponUsageLimit")}
              </label>
              <input
                type="number"
                min="0"
                value={form.max_uses ?? ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    max_uses: e.target.value
                      ? parseInt(e.target.value, 10)
                      : undefined,
                  }))
                }
                className={inputClass}
                placeholder="-"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">
                {t("couponExpiresAt")}
              </label>
              <input
                type="date"
                value={form.expires_at || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, expires_at: e.target.value || undefined }))
                }
                className={inputClass}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              onClick={editingId ? handleUpdate : handleCreate}
              disabled={savingId !== null}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Save className="h-4 w-4" />
              {t("save")}
            </Button>
            <Button
              onClick={resetForm}
              variant="outline"
            >
              <X className="h-4 w-4" />
              {t("close")}
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
                {t("couponCode")}
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                {t("couponType")}
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                {t("couponValue")}
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                {t("couponUsage")}
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                {t("couponExpiresAt")}
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
            {filteredCoupons.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16">
                  <EmptyState title={t("noResults")} />
                </td>
              </tr>
            ) : (
              filteredCoupons.map((coupon) => (
                <tr
                  key={coupon.id}
                  className="border-b border-slate-800 bg-slate-900/30 transition-colors hover:bg-slate-800/50"
                >
                  <td className="px-6 py-4 font-mono text-sm text-slate-200">
                    {coupon.code}
                  </td>
                  <td className="px-6 py-4">
                    <span className={getTypeBadge(coupon.discount_type)}>
                      {coupon.discount_type === "percent"
                        ? t("percentage")
                        : t("fixedAmount")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-200">
                    {formatValue(coupon)}
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {coupon.used_count} / {coupon.max_uses}
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {coupon.expires_at
                      ? format.dateTime(new Date(coupon.expires_at), { dateStyle: "medium" })
                      : "\u2014"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={getStatusBadge(coupon)}>
                      {getStatusLabel(coupon)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        onClick={() => handleEdit(coupon)}
                        variant="ghost"
                        size="icon-sm"
                        className="text-slate-400 hover:text-white"
                        title={t("edit")}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(coupon.id)}
                        disabled={deletingId === coupon.id}
                        variant="ghost"
                        size="icon-sm"
                        className="text-red-400 hover:text-red-300"
                        title={t("delete")}
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
      </>
      )}
    </div>
  );
}

/* ─── Coupon Sources Sub-section ─── */

function SourcesSection(): React.ReactNode {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const [sources, setSources] = useState<CouponSourceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    label: string;
    discount_type: "percent" | "fixed";
    discount_value: number;
    currency: string;
    max_claims: number | null;
    is_active: boolean;
  }>({
    label: "",
    discount_type: "percent",
    discount_value: 0,
    currency: "EUR",
    max_claims: null,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const loadSources = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getCouponSources();
      setSources(data);
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setLoading(false);
    }
  }, [tCommon]);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  const startEdit = (source: CouponSourceResponse) => {
    setEditingSourceId(source.id);
    setEditForm({
      label: source.label,
      discount_type: source.discount_type,
      discount_value: source.discount_value,
      currency: source.currency,
      max_claims: source.max_claims,
      is_active: source.is_active,
    });
  };

  const cancelEdit = () => {
    setEditingSourceId(null);
  };

  const handleSave = async () => {
    if (editingSourceId === null) {return;}
    setSaving(true);
    try {
      await adminApi.updateCouponSource(editingSourceId, {
        label: editForm.label.trim() || undefined,
        discount_type: editForm.discount_type,
        discount_value: editForm.discount_value,
        currency: editForm.currency,
        max_claims: editForm.max_claims ?? undefined,
        is_active: editForm.is_active,
      });
      toast.success(t("sourceUpdated"));
      setEditingSourceId(null);
      loadSources();
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setSaving(false);
    }
  };

  const formatSourceDiscount = (source: CouponSourceResponse) => {
    if (source.discount_type === "percent") {
      return `${source.discount_value}%`;
    }
    return format.number(source.discount_value, {
      style: "currency",
      currency: source.currency ?? "EUR",
      minimumFractionDigits: 2,
    });
  };

  const inputClass =
    "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500";

  if (loading) {
    return <TableSkeleton rows={6} cols={7} />;
  }

  return (
    <div className="space-y-4">
      {/* Edit form */}
      {editingSourceId !== null && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/95 p-4">
          <h3 className="mb-4 text-lg font-medium text-slate-200">
            {t("editSource")}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm text-slate-400">
                {t("sourceLabel")}
              </label>
              <input
                type="text"
                value={editForm.label}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, label: e.target.value }))
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">
                {t("couponType")}
              </label>
              <select
                value={editForm.discount_type}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    discount_type: e.target.value as "percent" | "fixed",
                  }))
                }
                className={inputClass}
              >
                <option value="percent">{t("percentage")}</option>
                <option value="fixed">{t("fixedAmount")}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">
                {t("couponValue")}
              </label>
              <input
                type="number"
                min="0"
                max={editForm.discount_type === "percent" ? 100 : undefined}
                step={editForm.discount_type === "percent" ? 1 : 0.01}
                value={editForm.discount_value}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    discount_value: parseFloat(e.target.value) || 0,
                  }))
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400">
                {t("maxClaims")}
              </label>
              <input
                type="number"
                min="1"
                value={editForm.max_claims ?? ""}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    max_claims: e.target.value
                      ? parseInt(e.target.value, 10)
                      : null,
                  }))
                }
                className={inputClass}
                placeholder="\u221e"
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={editForm.is_active}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, is_active: e.target.checked }))
                  }
                  className="rounded border-slate-600 bg-slate-800 text-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500"
                />
                {t("active")}
              </label>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Save className="h-4 w-4" />
              {t("save")}
            </Button>
            <Button onClick={cancelEdit} variant="outline">
              <X className="h-4 w-4" />
              {t("close")}
            </Button>
          </div>
        </div>
      )}

      {/* Sources table */}
      <div className="overflow-hidden rounded-xl border border-slate-800">
        <table className="w-full">
          <thead className="border-b border-slate-800 bg-slate-900/80">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                {t("sourceSlug")}
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                {t("sourceLabel")}
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                {t("discount")}
              </th>
              <th className="px-6 py-4 text-left text-sm font-medium text-slate-300">
                {t("claims")}
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
            {sources.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-16">
                  <EmptyState title={t("noResults")} />
                </td>
              </tr>
            ) : (
              sources.map((source) => (
                <tr
                  key={source.id}
                  className="border-b border-slate-800 bg-slate-900/30 transition-colors hover:bg-slate-800/50"
                >
                  <td className="px-6 py-4 font-mono text-sm text-slate-200">
                    {source.slug}
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {source.label}
                  </td>
                  <td className="px-6 py-4 text-slate-200">
                    {formatSourceDiscount(source)}
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {source.claims_count} / {source.max_claims ?? "\u221e"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        source.is_active
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-slate-500/20 text-slate-400"
                      }`}
                    >
                      {source.is_active ? t("active") : t("inactive")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      onClick={() => startEdit(source)}
                      variant="ghost"
                      size="icon-sm"
                      className="text-slate-400 hover:text-white"
                      title={t("edit")}
                    >
                      <Pencil className="h-4 w-4" />
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
