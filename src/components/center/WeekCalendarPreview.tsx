"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { Calendar, ChevronRight, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeekDay {
  date: Date;
  dateKey: string;
  participants: number;
  isToday: boolean;
}

interface WeekCalendarPreviewProps {
  weekDays: WeekDay[];
  locale: string;
  translations: {
    title: string;
    participants: string;
    noBookings: string;
    viewCalendar: string;
  };
}

function getDayName(date: Date, locale: string): string {
  return new Date(date).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
    weekday: "short",
  });
}

function getDayNumber(date: Date): number {
  return new Date(date).getDate();
}

export function WeekCalendarPreview({
  weekDays,
  locale,
  translations: t,
}: WeekCalendarPreviewProps) {
  const totalParticipants = weekDays.reduce((sum, day) => sum + day.participants, 0);

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <CardTitle className="text-lg text-white">{t.title}</CardTitle>
          {totalParticipants > 0 && (
            <span className="flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-0.5 text-xs text-cyan-200">
              <Users className="h-3 w-3" />
              {totalParticipants} {t.participants}
            </span>
          )}
        </div>
        <Link
          href="/center/calendar"
          className="flex items-center gap-1 text-sm text-cyan-400 transition hover:text-cyan-300"
        >
          {t.viewCalendar}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <div
              key={day.dateKey}
              className={cn(
                "relative flex flex-col items-center rounded-xl p-3 transition",
                day.isToday
                  ? "border border-cyan-500/30 bg-cyan-500/10"
                  : "border border-white/5 bg-white/5 hover:bg-white/10"
              )}
            >
              <span
                className={cn(
                  "text-xs font-medium uppercase",
                  day.isToday ? "text-cyan-300" : "text-white/50"
                )}
              >
                {getDayName(day.date, locale)}
              </span>
              <span
                className={cn(
                  "mt-1 text-xl font-bold",
                  day.isToday ? "text-cyan-200" : "text-white"
                )}
              >
                {getDayNumber(day.date)}
              </span>
              {day.participants > 0 ? (
                <div
                  className={cn(
                    "mt-2 flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
                    day.isToday
                      ? "bg-cyan-500/20 text-cyan-200"
                      : "bg-emerald-500/20 text-emerald-300"
                  )}
                >
                  <Users className="h-3 w-3" />
                  {day.participants}
                </div>
              ) : (
                <div className="mt-2 h-5 text-xs text-white/30">-</div>
              )}
            </div>
          ))}
        </div>

        {totalParticipants === 0 && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <Calendar className="mx-auto h-8 w-8 text-white/20" />
            <p className="mt-2 text-sm text-white/50">{t.noBookings}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
