"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string | number;
  evolution?: number;
  evolutionLabel?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  suffix?: string;
  prefix?: string;
}

export function StatsCard({
  label,
  value,
  evolution,
  evolutionLabel,
  icon: Icon,
  iconColor = "text-cyan-400",
  iconBgColor = "bg-cyan-500/10",
  suffix,
  prefix,
}: StatsCardProps) {
  const showEvolution = evolution !== undefined;
  const isPositive = evolution !== undefined && evolution > 0;
  const isNegative = evolution !== undefined && evolution < 0;
  const isNeutral = evolution !== undefined && evolution === 0;

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-white/60">{label}</p>
            <p className="mt-2 text-2xl font-bold text-white">
              {prefix && <span className="text-lg font-normal text-white/70">{prefix}</span>}
              {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
              {suffix && <span className="text-lg font-normal text-white/70">{suffix}</span>}
            </p>
            
            {showEvolution && (
              <div className="mt-2 flex items-center gap-1.5">
                {isPositive && (
                  <>
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-400">
                      +{evolution.toFixed(1)}%
                    </span>
                  </>
                )}
                {isNegative && (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-400" />
                    <span className="text-sm font-medium text-red-400">
                      {evolution.toFixed(1)}%
                    </span>
                  </>
                )}
                {isNeutral && (
                  <>
                    <Minus className="h-4 w-4 text-white/40" />
                    <span className="text-sm font-medium text-white/40">0%</span>
                  </>
                )}
                {evolutionLabel && (
                  <span className="text-xs text-white/40">{evolutionLabel}</span>
                )}
              </div>
            )}
          </div>
          
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", iconBgColor)}>
            <Icon className={cn("h-6 w-6", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
