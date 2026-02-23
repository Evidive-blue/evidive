"use client";

import { useState, useMemo, useCallback, Fragment, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/empty-state";

// ─── Types ───────────────────────────────────────────────────────────────────

export type SortDirection = "asc" | "desc";

export type ColumnDef<T> = {
  /** Unique key for the column */
  key: string;
  /** i18n label key (resolved via admin namespace) */
  labelKey: string;
  /** Custom render function */
  render?: (row: T) => ReactNode;
  /** Accessor function for sorting & default rendering */
  accessor?: (row: T) => string | number | boolean | null | undefined;
  /** Whether column is sortable (default: true if accessor provided) */
  sortable?: boolean;
  /** Header alignment */
  align?: "left" | "center" | "right";
  /** Additional header className */
  className?: string;
};

export type FilterOption = {
  value: string;
  label: string;
};

export type FilterDef = {
  key: string;
  labelKey: string;
  options: FilterOption[];
};

type AdminTableProps<T> = {
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** Data rows */
  data: T[];
  /** Unique key extractor */
  rowKey: (row: T) => string;
  /** Search placeholder i18n key */
  searchPlaceholder?: string;
  /** Fields to search across (using accessor) */
  searchFields?: ((row: T) => string | null | undefined)[];
  /** Filter definitions */
  filters?: FilterDef[];
  /** Actions column render */
  renderActions?: (row: T) => ReactNode;
  /** Row click handler */
  onRowClick?: (row: T) => void;
  /** Expandable row content */
  renderExpanded?: (row: T) => ReactNode;
  /** Items per page options */
  pageSizeOptions?: number[];
  /** Default page size */
  defaultPageSize?: number;
  /** Default sort column */
  defaultSortKey?: string;
  /** Default sort direction */
  defaultSortDir?: SortDirection;
  /** Loading state */
  loading?: boolean;
  /** Additional class for wrapper */
  className?: string;
};

// ─── Component ───────────────────────────────────────────────────────────────

export function AdminTable<T>({
  columns,
  data,
  rowKey,
  searchPlaceholder,
  searchFields,
  filters,
  renderActions,
  onRowClick,
  renderExpanded,
  pageSizeOptions = [10, 25, 50],
  defaultPageSize = 10,
  defaultSortKey,
  defaultSortDir = "asc",
  loading,
  className,
}: AdminTableProps<T>) {
  const t = useTranslations("admin");

  // ── State ──────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey ?? null);
  const [sortDir, setSortDir] = useState<SortDirection>(defaultSortDir);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = data;

    // Text search
    if (search.trim() && searchFields?.length) {
      const q = search.toLowerCase();
      result = result.filter((row) =>
        searchFields.some((fn) => {
          const val = fn(row);
          return val ? val.toLowerCase().includes(q) : false;
        })
      );
    }

    // Dropdown filters
    for (const [key, value] of Object.entries(activeFilters)) {
      if (value === "all") {continue;}
      const col = columns.find((c) => c.key === key);
      const accessor = col?.accessor;
      if (accessor) {
        result = result.filter((row) => {
          const cellVal = accessor(row);
          return cellVal !== null && cellVal !== undefined && String(cellVal).toLowerCase() === value.toLowerCase();
        });
      }
    }

    return result;
  }, [data, search, searchFields, activeFilters, columns]);

  // ── Sorting ────────────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    if (!sortKey) {return filtered;}
    const col = columns.find((c) => c.key === sortKey);
    const accessor = col?.accessor;
    if (!accessor) {return filtered;}

    return [...filtered].sort((a, b) => {
      const valA = accessor(a);
      const valB = accessor(b);
      if (valA === null && valB === null) {return 0;}
      if (valA === undefined && valB === undefined) {return 0;}
      if (valA === null || valA === undefined) {return 1;}
      if (valB === null || valB === undefined) {return -1;}

      let cmp: number;
      if (typeof valA === "number" && typeof valB === "number") {
        cmp = valA - valB;
      } else {
        cmp = String(valA).localeCompare(String(valB));
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
  }, [filtered, sortKey, sortDir, columns]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paginated = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
      setPage(0);
    },
    [sortKey]
  );

  const handleFilterChange = useCallback((key: string, value: string) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  }, []);

  const handleToggleExpand = useCallback(
    (id: string) => {
      setExpandedId((prev) => (prev === id ? null : id));
    },
    []
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={className}>
      {/* Toolbar: search + filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        {searchFields && searchFields.length > 0 && (
          <div className="flex-1 min-w-[220px]">
            <input
              type="search"
              placeholder={searchPlaceholder ? t(searchPlaceholder) : t("search")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-white placeholder-slate-500 focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            />
          </div>
        )}

        {filters?.map((filter) => (
          <div key={filter.key} className="min-w-[160px]">
            <label className="mb-1 block text-xs text-slate-500">{t(filter.labelKey)}</label>
            <select
              value={activeFilters[filter.key] ?? "all"}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 transition-colors hover:border-slate-600 focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              <option value="all">{t("all")}</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Result count */}
        <div className="ml-auto text-xs text-slate-500">
          {filtered.length} {t("results")}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full">
          <thead className="border-b border-slate-800 bg-slate-900/80">
            <tr>
              {columns.map((col) => {
                const isSortable = col.sortable !== false && !!col.accessor;
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-400 ${
                      col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                    } ${isSortable ? "cursor-pointer select-none hover:text-slate-200" : ""} ${col.className ?? ""}`}
                    onClick={isSortable ? () => handleSort(col.key) : undefined}
                    onKeyDown={isSortable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSort(col.key); } } : undefined}
                    tabIndex={isSortable ? 0 : undefined}
                    role={isSortable ? "button" : undefined}
                    aria-sort={isSorted ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {t(col.labelKey)}
                      {isSortable && (
                        <span className="inline-flex flex-col">
                          {isSorted ? (
                            sortDir === "asc" ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )
                          ) : (
                            <ChevronsUpDown className="h-3 w-3 text-slate-600" />
                          )}
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
              {renderActions && (
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("actions")}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skel-${i}`}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 w-20 animate-pulse rounded bg-slate-800" />
                    </td>
                  ))}
                  {renderActions && (
                    <td className="px-4 py-3">
                      <div className="ml-auto h-4 w-16 animate-pulse rounded bg-slate-800" />
                    </td>
                  )}
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (renderActions ? 1 : 0)} className="px-4 py-12">
                  <EmptyState title={t("noResults")} />
                </td>
              </tr>
            ) : (
              paginated.map((row) => {
                const id = rowKey(row);
                const isExpanded = expandedId === id;
                return (
                  <Fragment key={id}>
                    <tr
                      className={`transition-colors hover:bg-slate-800/50 ${
                        onRowClick || renderExpanded ? "cursor-pointer" : ""
                      }`}
                      onClick={() => {
                        if (onRowClick) {onRowClick(row);}
                        if (renderExpanded) {handleToggleExpand(id);}
                      }}
                      onKeyDown={(onRowClick || renderExpanded) ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (onRowClick) {onRowClick(row);} if (renderExpanded) {handleToggleExpand(id);} } } : undefined}
                      tabIndex={(onRowClick || renderExpanded) ? 0 : undefined}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={`px-4 py-3 text-sm text-slate-300 ${
                            col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                          }`}
                        >
                          {col.render
                            ? col.render(row)
                            : col.accessor
                              ? String(col.accessor(row) ?? "-")
                              : "-"}
                        </td>
                      ))}
                      {renderActions && (
                        <td
                          className="px-4 py-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {renderActions(row)}
                        </td>
                      )}
                    </tr>
                    {renderExpanded && isExpanded && (
                      <tr key={`${id}-exp`}>
                        <td colSpan={columns.length + (renderActions ? 1 : 0)} className="bg-slate-900/50 px-4 py-4">
                          {renderExpanded(row)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && sorted.length > (pageSizeOptions[0] ?? 10) && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <span>{t("rowsPerPage")}</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
              className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300 focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span>
              {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, sorted.length)}{" "}
              / {sorted.length}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="text-slate-400 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="text-slate-400 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
