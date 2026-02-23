"use client";

import { useMemo } from "react";
import { Search, MapPin, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface CentersFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCountry: string | null;
  onCountryChange: (country: string | null) => void;
  countries: string[];
  totalCount: number;
  filteredCount: number;
}

export function CentersFilters({
  searchQuery,
  onSearchChange,
  selectedCountry,
  onCountryChange,
  countries,
  totalCount,
  filteredCount,
}: CentersFiltersProps) {
  const t = useTranslations("centers.directory");
  const tCommon = useTranslations("common");

  const sortedCountries = useMemo(
    () => [...countries].sort((a, b) => a.localeCompare(b)),
    [countries]
  );

  const hasActiveFilter = searchQuery.length > 0 || selectedCountry !== null;

  const clearFilters = () => {
    onSearchChange("");
    onCountryChange(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("subtitle")}
            className="w-full rounded-lg border border-white/20 bg-white/10 py-2.5 pl-9 pr-9 text-white placeholder:text-slate-400 focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          />
          {searchQuery.length > 0 && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-white"
              aria-label={tCommon("reset")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2 text-sm text-slate-400">
          <MapPin className="h-4 w-4" />
          <span>
            {filteredCount} / {totalCount} {t("centersLabel")}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {sortedCountries.map((country) => (
          <button
            key={country}
            type="button"
            onClick={() =>
              onCountryChange(selectedCountry === country ? null : country)
            }
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              selectedCountry === country
                ? "bg-cyan-500/30 text-cyan-200 ring-1 ring-cyan-500/50"
                : "border border-white/20 bg-white/5 text-slate-300 hover:border-cyan-500/50 hover:bg-white/10"
            )}
          >
            {country}
          </button>
        ))}
        {hasActiveFilter && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex h-6 items-center gap-1 rounded px-2 text-xs text-slate-400 transition-colors hover:text-white"
          >
            <X className="h-3 w-3" />
            {tCommon("reset")}
          </button>
        )}
      </div>
    </div>
  );
}
