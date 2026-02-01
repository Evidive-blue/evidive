"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StatsPeriod } from "@/actions/center-stats";

interface PeriodSelectorProps {
  value: StatsPeriod;
  onChange: (period: StatsPeriod) => void;
  translations: {
    "30d": string;
    "90d": string;
    "12m": string;
    all: string;
  };
}

const periods: StatsPeriod[] = ["30d", "90d", "12m", "all"];

export function PeriodSelector({ value, onChange, translations }: PeriodSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {periods.map((period) => (
        <Button
          key={period}
          variant="ghost"
          size="sm"
          onClick={() => onChange(period)}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium transition-all",
            value === period
              ? "bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30"
              : "text-white/60 hover:bg-white/10 hover:text-white"
          )}
        >
          {translations[period]}
        </Button>
      ))}
    </div>
  );
}
