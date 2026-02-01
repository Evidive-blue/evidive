"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalendarCheck, CalendarDays, Wallet, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatItem {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  suffix?: string;
}

interface CenterStatsCardsProps {
  todayBookings: number;
  weekBookings: number;
  monthRevenue: number;
  rating: number;
  translations: {
    todayBookings: string;
    weekBookings: string;
    monthRevenue: string;
    rating: string;
  };
}

export function CenterStatsCards({
  todayBookings,
  weekBookings,
  monthRevenue,
  rating,
  translations: t,
}: CenterStatsCardsProps) {
  const stats: StatItem[] = [
    {
      label: t.todayBookings,
      value: todayBookings,
      icon: CalendarCheck,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
    },
    {
      label: t.weekBookings,
      value: weekBookings,
      icon: CalendarDays,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: t.monthRevenue,
      value: monthRevenue.toLocaleString("fr-FR", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
      icon: Wallet,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
    {
      label: t.rating,
      value: rating > 0 ? rating.toFixed(1) : "-",
      icon: Star,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      suffix: rating > 0 ? "/5" : "",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="border-white/10 bg-white/5 backdrop-blur-xl"
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl",
                  stat.bgColor
                )}
              >
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {stat.value}
                  {stat.suffix && (
                    <span className="text-base font-normal text-white/50">
                      {stat.suffix}
                    </span>
                  )}
                </p>
                <p className="text-sm text-white/60">{stat.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
