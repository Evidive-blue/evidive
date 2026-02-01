"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Ban, Users } from "lucide-react";

interface DaySlotProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isBlocked: boolean;
  blockedTimes: string[];
  totalParticipants: number;
  totalCapacity: number;
  bookingsCount: number;
  locale: string;
  translations: {
    fillRate: Record<string, string>;
    blockedDates: string;
  };
  onClick: () => void;
  onBlockClick: () => void;
}

function getFillRateColor(participants: number, capacity: number): {
  bgColor: string;
  textColor: string;
  borderColor: string;
  level: "low" | "medium" | "high" | "none";
} {
  if (capacity === 0 || participants === 0) {
    return {
      bgColor: "",
      textColor: "text-white/30",
      borderColor: "border-white/5",
      level: "none",
    };
  }

  const rate = (participants / capacity) * 100;

  if (rate < 50) {
    return {
      bgColor: "bg-emerald-500/10",
      textColor: "text-emerald-300",
      borderColor: "border-emerald-500/20",
      level: "low",
    };
  } else if (rate < 80) {
    return {
      bgColor: "bg-amber-500/10",
      textColor: "text-amber-300",
      borderColor: "border-amber-500/20",
      level: "medium",
    };
  } else {
    return {
      bgColor: "bg-red-500/10",
      textColor: "text-red-300",
      borderColor: "border-red-500/20",
      level: "high",
    };
  }
}

export function DaySlot({
  date,
  isCurrentMonth,
  isToday,
  isBlocked,
  blockedTimes,
  totalParticipants,
  totalCapacity,
  bookingsCount,
  locale,
  translations: t,
  onClick,
  onBlockClick,
}: DaySlotProps) {
  const dayNumber = date.getDate();
  const { bgColor, textColor, borderColor, level } = getFillRateColor(
    totalParticipants,
    totalCapacity
  );

  const hasPartialBlock = !isBlocked && blockedTimes.length > 0;
  const hasBookings = bookingsCount > 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex min-h-[80px] flex-col items-center rounded-xl border p-2 transition-all",
        "hover:border-white/20 hover:bg-white/5",
        isBlocked && "cursor-not-allowed opacity-60",
        isToday && !isBlocked && "ring-2 ring-cyan-500/50",
        !isCurrentMonth && "opacity-40",
        isBlocked
          ? "border-slate-600/30 bg-slate-600/10"
          : hasBookings
          ? cn(borderColor, bgColor)
          : "border-white/5 bg-white/[0.02]"
      )}
      disabled={false}
    >
      {/* Day number */}
      <span
        className={cn(
          "text-sm font-medium",
          isToday ? "text-cyan-300" : isCurrentMonth ? "text-white" : "text-white/40",
          isBlocked && "text-white/40"
        )}
      >
        {dayNumber}
      </span>

      {/* Blocked indicator */}
      {isBlocked && (
        <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
          <Ban className="h-3 w-3" />
        </div>
      )}

      {/* Partial block indicator */}
      {hasPartialBlock && (
        <div className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-500" />
      )}

      {/* Bookings info */}
      {hasBookings && !isBlocked && (
        <div className="mt-auto flex flex-col items-center gap-1">
          {/* Participants badge */}
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              level === "low" && "bg-emerald-500/20 text-emerald-200",
              level === "medium" && "bg-amber-500/20 text-amber-200",
              level === "high" && "bg-red-500/20 text-red-200"
            )}
          >
            <Users className="h-3 w-3" />
            <span>
              {totalParticipants}/{totalCapacity}
            </span>
          </div>

          {/* Fill rate bar */}
          <div className="h-1 w-full max-w-[40px] overflow-hidden rounded-full bg-white/10">
            <div
              className={cn(
                "h-full transition-all",
                level === "low" && "bg-emerald-500",
                level === "medium" && "bg-amber-500",
                level === "high" && "bg-red-500"
              )}
              style={{
                width: `${Math.min((totalParticipants / totalCapacity) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Empty state */}
      {!hasBookings && !isBlocked && isCurrentMonth && (
        <div className="mt-auto text-[10px] text-white/20">-</div>
      )}
    </button>
  );
}
