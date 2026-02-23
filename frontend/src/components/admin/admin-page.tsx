"use client";

import { useTranslations } from "next-intl";
import { PageHeader } from "./page-header";
import { EmptyState } from "./empty-state";

type AdminPageProps = {
  titleKey: string;
  columns: string[];
};

/**
 * Simple placeholder admin page for routes that are not yet fully implemented.
 * Displays a page header and an empty table with column headers.
 */
export function AdminPage({ titleKey, columns }: AdminPageProps) {
  const t = useTranslations("admin");

  return (
    <div className="space-y-6">
      <PageHeader titleKey={titleKey} />
      <div className="overflow-hidden rounded-xl border border-slate-800">
        <table className="w-full">
          <thead className="border-b border-slate-800 bg-slate-900/80">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-6 py-4 text-left text-sm font-medium text-slate-300"
                >
                  {t(col)}
                </th>
              ))}
              <th className="px-6 py-4 text-right text-sm font-medium text-slate-300">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={columns.length + 1}
                className="px-6 py-16"
              >
                <EmptyState title={t("noResults")} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
