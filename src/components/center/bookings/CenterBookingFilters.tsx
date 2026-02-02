"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Search, X, CalendarDays, Filter, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@prisma/client";
import { exportBookingsCSV } from "@/app/[locale]/center/bookings/actions";

type StatusFilter = BookingStatus | "all";

interface CenterBookingFiltersProps {
  currentStatus: StatusFilter;
  currentSearch: string;
  currentDateFrom?: string;
  currentDateTo?: string;
  services: Array<{ id: string; name: string }>;
  currentServiceId?: string;
  counts: Record<StatusFilter, number>;
  basePath?: string;
  centerId?: string;
  translations: {
    search: string;
    searchPlaceholder: string;
    status: string;
    all: string;
    pending: string;
    confirmed: string;
    paid: string;
    completed: string;
    cancelled: string;
    running: string;
    noshow: string;
    dateRange: string;
    from: string;
    to: string;
    service: string;
    allServices: string;
    clearFilters: string;
    exportCsv: string;
    exporting: string;
  };
}

const statusOptions: { value: StatusFilter; colorClass: string }[] = [
  { value: "all", colorClass: "bg-white/10 text-white" },
  { value: "PENDING", colorClass: "bg-amber-500/10 text-amber-400" },
  { value: "CONFIRMED", colorClass: "bg-blue-500/10 text-blue-400" },
  { value: "PAID", colorClass: "bg-emerald-500/10 text-emerald-400" },
  { value: "RUNNING", colorClass: "bg-cyan-500/10 text-cyan-400" },
  { value: "COMPLETED", colorClass: "bg-gray-500/10 text-gray-400" },
  { value: "CANCELLED", colorClass: "bg-red-500/10 text-red-400" },
  { value: "NOSHOW", colorClass: "bg-orange-500/10 text-orange-400" },
];

export function CenterBookingFilters({
  currentStatus,
  currentSearch,
  currentDateFrom,
  currentDateTo,
  services,
  currentServiceId,
  counts,
  // basePath is kept for API compatibility but not used in this component
  centerId,
  translations: t,
}: CenterBookingFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentSearch);
  const [isExporting, setIsExporting] = useState(false);
  const [isPending, startTransition] = useTransition();

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === "" || value === "all") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      startTransition(() => {
        router.push(`?${params.toString()}`, { scroll: false });
      });
    },
    [router, searchParams]
  );

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      updateParams({ search: search || undefined });
    },
    [search, updateParams]
  );

  const handleStatusChange = useCallback(
    (status: StatusFilter) => {
      updateParams({ status: status === "all" ? undefined : status });
    },
    [updateParams]
  );

  const handleClearFilters = useCallback(() => {
    setSearch("");
    router.push("?", { scroll: false });
  }, [router]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const result = await exportBookingsCSV({
        centerId,
        status: currentStatus !== "all" ? currentStatus : undefined,
        dateFrom: currentDateFrom ? new Date(currentDateFrom) : undefined,
        dateTo: currentDateTo ? new Date(currentDateTo) : undefined,
        serviceId: currentServiceId,
        search: currentSearch || undefined,
      });

      if (result.success && result.csv) {
        const blob = new Blob(["\uFEFF" + result.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `reservations-${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setIsExporting(false);
    }
  }, [centerId, currentStatus, currentDateFrom, currentDateTo, currentServiceId, currentSearch]);

  const hasActiveFilters =
    currentStatus !== "all" ||
    currentSearch ||
    currentDateFrom ||
    currentDateTo ||
    currentServiceId;

  const getStatusLabel = (status: StatusFilter): string => {
    const labels: Record<StatusFilter, string> = {
      all: t.all,
      PENDING: t.pending,
      CONFIRMED: t.confirmed,
      PAID: t.paid,
      RUNNING: t.running,
      COMPLETED: t.completed,
      CANCELLED: t.cancelled,
      NOSHOW: t.noshow,
      REMOVED: "Supprimé",
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-4">
      {/* Search and Export Row */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
        </form>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isExporting ? t.exporting : t.exportCsv}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-white/60 hover:text-white"
          >
            <X className="mr-1 h-4 w-4" />
            {t.clearFilters}
          </Button>
        )}
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        {statusOptions.map(({ value, colorClass }) => {
          const isActive = currentStatus === value;
          const count = counts[value] ?? 0;

          return (
            <button
              key={value}
              onClick={() => handleStatusChange(value)}
              disabled={isPending}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/25"
                  : cn(colorClass, "hover:opacity-80")
              )}
            >
              {getStatusLabel(value)}
              <span
                className={cn(
                  "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs",
                  isActive ? "bg-white/20" : "bg-white/10"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Date Range and Service Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-white/40" />
          <Input
            type="date"
            value={currentDateFrom || ""}
            onChange={(e) => updateParams({ dateFrom: e.target.value || undefined })}
            className="w-auto bg-white/5 border-white/10 text-white text-sm"
          />
          <span className="text-white/40">→</span>
          <Input
            type="date"
            value={currentDateTo || ""}
            onChange={(e) => updateParams({ dateTo: e.target.value || undefined })}
            className="w-auto bg-white/5 border-white/10 text-white text-sm"
          />
        </div>

        {services.length > 0 && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-white/40" />
            <select
              value={currentServiceId || ""}
              onChange={(e) => updateParams({ serviceId: e.target.value || undefined })}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="">{t.allServices}</option>
              {services.map((service) => (
                <option key={service.id} value={service.id} className="bg-gray-900">
                  {service.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
