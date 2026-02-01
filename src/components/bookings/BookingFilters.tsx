"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

type FilterValue = "all" | "upcoming" | "past" | "cancelled";

interface BookingFiltersProps {
  currentFilter: FilterValue;
  translations: {
    all: string;
    upcoming: string;
    past: string;
    cancelled: string;
  };
  counts?: {
    all: number;
    upcoming: number;
    past: number;
    cancelled: number;
  };
}

export function BookingFilters({
  currentFilter,
  translations,
  counts,
}: BookingFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = useCallback(
    (filter: FilterValue) => {
      const params = new URLSearchParams(searchParams.toString());
      if (filter === "all") {
        params.delete("filter");
      } else {
        params.set("filter", filter);
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const filters: { value: FilterValue; label: string }[] = [
    { value: "all", label: translations.all },
    { value: "upcoming", label: translations.upcoming },
    { value: "past", label: translations.past },
    { value: "cancelled", label: translations.cancelled },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const isActive = currentFilter === filter.value;
        const count = counts?.[filter.value];

        return (
          <button
            key={filter.value}
            onClick={() => handleFilterChange(filter.value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all",
              isActive
                ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/25"
                : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            )}
          >
            {filter.label}
            {count !== undefined && (
              <span
                className={cn(
                  "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs",
                  isActive ? "bg-white/20" : "bg-white/10"
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
