"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { toast } from "sonner";
import {
  adminApi,
  type PublicCenter,
} from "@/lib/api";

const inputClass =
  "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 transition-colors hover:border-slate-600 focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:bg-slate-700 dark:border-slate-600";

const cardClass =
  "rounded-xl border border-slate-800 bg-slate-900 p-6 dark:bg-slate-800 dark:border-slate-700";

const sectionTitleClass = "text-lg font-semibold text-white mb-4";

type Props = {
  centerId: string;
};

export function AdminCenterDetailClient({ centerId }: Props): React.JSX.Element {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);
  const [data, setData] = useState<PublicCenter | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const profile = await adminApi.getCenter(centerId);
      setData(profile);
    } catch {
      setError(t("loadError"));
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [centerId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (): Promise<void> => {
    if (!data) {return;}
    setSaving(true);
    try {
      const updated = await adminApi.updateCenter(centerId, {
        name: data.name,
        description: data.description,
        address: data.address,
        city: data.city,
        postal_code: data.postal_code,
        country: data.country,
        phone: data.phone,
        website: data.website,
        latitude: data.latitude,
        longitude: data.longitude,
        slug: data.slug,
        is_featured: data.is_featured,
        logo_url: data.logo_url,
        cover_url: data.cover_url,
      });
      toast.success(t("centerProfileUpdated"));
      setData(updated);
    } catch {
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (): Promise<void> => {
    setActioning("approve");
    try {
      await adminApi.approveCenter(centerId);
      toast.success(t("centerApproved"));
      load();
    } catch {
      toast.error(t("loadError"));
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async (): Promise<void> => {
    setActioning("reject");
    try {
      await adminApi.rejectCenter(centerId);
      toast.success(t("centerRejected"));
      load();
    } catch {
      toast.error(t("loadError"));
    } finally {
      setActioning(null);
    }
  };

  const update = <K extends keyof PublicCenter>(
    key: K,
    value: PublicCenter[K]
  ): void => {
    setData((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        <span className="text-slate-400">{tCommon("loading")}</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg bg-red-500/20 px-4 py-3 text-red-400">
        {error ?? t("centerNotFound")}
      </div>
    );
  }

  const isPending = data.status === "pending";

  return (
    <div className="space-y-6">
      {/* Section 1: Status & Actions */}
      <div className={cardClass}>
        <h2 className={sectionTitleClass}>{t("status")}</h2>
        <div className="flex flex-wrap items-center gap-4">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              data.status === "active"
                ? "bg-emerald-500/20 text-emerald-400"
                : data.status === "pending"
                  ? "bg-amber-500/20 text-amber-400"
                  : data.status === "rejected"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-slate-500/20 text-slate-400"
            }`}
          >
            {data.status}
          </span>
          {isPending && (
            <>
              <button
                type="button"
                onClick={handleApprove}
                disabled={!!actioning}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50"
              >
                {actioning === "approve" ? "…" : t("approve")}
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={!!actioning}
                className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50"
              >
                {actioning === "reject" ? "…" : t("reject")}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Section 2: General Information */}
      <div className={cardClass}>
        <h2 className={sectionTitleClass}>{t("centerGeneral")}</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-slate-300">
              {t("name")}
            </label>
            <input
              type="text"
              value={data.name ?? ""}
              onChange={(e) => update("name", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">
              {t("description")}
            </label>
            <textarea
              value={data.description ?? ""}
              onChange={(e) => update("description", e.target.value || null)}
              className={inputClass}
              rows={4}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">
              {t("slug")}
            </label>
            <input
              type="text"
              value={data.slug ?? ""}
              readOnly
              className={`${inputClass} cursor-not-allowed bg-slate-800/50 text-slate-400`}
            />
          </div>
        </div>
      </div>

      {/* Section 3: Location */}
      <div className={cardClass}>
        <h2 className={sectionTitleClass}>{t("centerLocation")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-slate-300">
              {t("address")}
            </label>
            <input
              type="text"
              value={data.address ?? ""}
              onChange={(e) => update("address", e.target.value || null)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">
              {t("city")}
            </label>
            <input
              type="text"
              value={data.city ?? ""}
              onChange={(e) => update("city", e.target.value || null)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">
              {t("zip")}
            </label>
            <input
              type="text"
              value={data.postal_code ?? ""}
              onChange={(e) => update("postal_code", e.target.value || null)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">
              {t("country")}
            </label>
            <input
              type="text"
              value={data.country ?? ""}
              onChange={(e) => update("country", e.target.value ?? "")}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">
              {t("latitude")}
            </label>
            <input
              type="number"
              step="any"
              value={data.latitude ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                update("latitude", v === "" ? null : parseFloat(v));
              }}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">
              {t("longitude")}
            </label>
            <input
              type="number"
              step="any"
              value={data.longitude ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                update("longitude", v === "" ? null : parseFloat(v));
              }}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Section 4: Contact */}
      <div className={cardClass}>
        <h2 className={sectionTitleClass}>{t("centerContact")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-slate-300">
              {t("phone")}
            </label>
            <input
              type="text"
              value={data.phone ?? ""}
              onChange={(e) => update("phone", e.target.value || null)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">
              {t("website")}
            </label>
            <input
              type="url"
              value={data.website ?? ""}
              onChange={(e) => update("website", e.target.value || null)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Section 5: Meta */}
      <div className={cardClass}>
        <h2 className={sectionTitleClass}>{t("centerMeta")}</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={data.is_featured}
                onChange={(e) => update("is_featured", e.target.checked)}
                className="rounded border-slate-600 bg-slate-800 text-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500"
              />
              {t("featured")}
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={false}
                readOnly
                aria-hidden
                className="rounded border-slate-600 bg-slate-800 text-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500"
              />
              {t("verified")}
            </label>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-slate-400">
            <span>
              {t("createdAt")}:{" "}
              {data.created_at
                ? format.dateTime(new Date(data.created_at), { dateStyle: "medium", timeStyle: "short" })
                : "—"}
            </span>
            <span>
              {t("updatedAt")}:{" "}
              {data.updated_at
                ? format.dateTime(new Date(data.updated_at), { dateStyle: "medium", timeStyle: "short" })
                : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {saving ? "…" : t("save")}
        </button>
      </div>
    </div>
  );
}
