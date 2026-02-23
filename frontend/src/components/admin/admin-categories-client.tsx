"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { PageHeader } from "@/components/admin/page-header";
import { TableSkeleton } from "@/components/admin/loading-skeleton";
import { EmptyState } from "@/components/admin/empty-state";

type Category = {
  code: string;
  name: string;
  icon: string | null;
};

export function AdminCategoriesClient() {
  const t = useTranslations("admin");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getCategories();
      setCategories(
        data.map((c) => ({
          code: c.code,
          name: c.name_en,
          icon: c.icon ?? null,
        }))
      );
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return (
    <div className="space-y-6">
      <PageHeader titleKey="categories" />

      {loading ? (
        <TableSkeleton rows={5} cols={3} />
      ) : categories.length === 0 ? (
        <EmptyState title={t("noResults")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("code")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("name")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("icon")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {categories.map((category) => (
                <tr
                  key={category.code}
                  className="transition-colors hover:bg-slate-800/50"
                >
                  <td className="px-4 py-3">
                    <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-xs text-cyan-400">
                      {category.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">
                    {category.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {category.icon ?? "\u2014"}
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
