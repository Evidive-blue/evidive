"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  centerApi,
  type CalendarEvent,
  type BlockedDateResponse,
} from "@/lib/api";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { PageSkeleton } from "@/components/admin/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const blockedDateSchema = z.object({
  blocked_date: z.string().min(1, "Required"),
  reason: z.string().optional(),
});

type BlockedDateForm = z.infer<typeof blockedDateSchema>;

export function DashboardCalendarClient() {
  const t = useTranslations("dashboard");
  const calFormat = useFormatter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDateResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState<Date>(getMonday(new Date()));
  const [showBlockForm, setShowBlockForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cal, blocked] = await Promise.all([
        centerApi.getCalendar(),
        centerApi.getBlockedDates(),
      ]);
      setEvents(cal);
      setBlockedDates(blocked);
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const weekDays = getWeekDays(currentWeek);
  const hours = Array.from({ length: 12 }, (_, i) => i + 7); // 7:00 - 18:00

  const goToPrev = () => {
    const d = new Date(currentWeek);
    d.setDate(d.getDate() - 7);
    setCurrentWeek(d);
  };

  const goToNext = () => {
    const d = new Date(currentWeek);
    d.setDate(d.getDate() + 7);
    setCurrentWeek(d);
  };

  const handleDeleteBlocked = async (id: string) => {
    try {
      await centerApi.deleteBlockedDate(id);
      toast.success(t("dateUnblocked"));
      setBlockedDates((prev) => prev.filter((b) => b.id !== id));
    } catch {
      toast.error(t("saveError"));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="calendar"
        namespace="dashboard"
      >
        <Button
          onClick={() => setShowBlockForm(!showBlockForm)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <Plus className="h-4 w-4" />
          {t("blockDates")}
        </Button>
      </PageHeader>

      {/* Block dates form */}
      {showBlockForm && (
        <BlockDateForm
          onCancel={() => setShowBlockForm(false)}
          onSaved={() => {
            setShowBlockForm(false);
            load();
          }}
        />
      )}

      {/* Week navigation */}
      <div className="flex items-center gap-4">
        <Button
          onClick={goToPrev}
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="text-sm font-medium">
          {weekDays[0] ? calFormat.dateTime(weekDays[0], { dateStyle: "medium" }) : ""} &ndash;{" "}
          {weekDays[6] ? calFormat.dateTime(weekDays[6], { dateStyle: "medium" }) : ""}
        </span>
        <Button
          onClick={goToNext}
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {loading ? (
        <PageSkeleton />
      ) : (
        <>
          {/* Calendar grid */}
          <div className="overflow-auto rounded-xl border border-slate-800">
            <div className="min-w-[800px]">
              {/* Day headers */}
              <div className="grid grid-cols-8 border-b border-slate-800 bg-slate-900">
                <div className="p-2 text-xs text-slate-500" />
                {weekDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className="border-l border-slate-800 p-2 text-center text-xs font-medium text-slate-300"
                  >
                    {calFormat.dateTime(day, {
                      weekday: "short",
                      day: "numeric",
                    })}
                  </div>
                ))}
              </div>

              {/* Hour rows */}
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="grid grid-cols-8 border-b border-slate-800/50"
                >
                  <div className="p-2 text-right text-xs text-slate-500">
                    {hour}:00
                  </div>
                  {weekDays.map((day) => {
                    const dayEvents = events.filter((e) => {
                      const start = new Date(e.start_time);
                      return (
                        start.toDateString() === day.toDateString() &&
                        start.getHours() === hour
                      );
                    });
                    return (
                      <div
                        key={`${day.toISOString()}-${hour}`}
                        className="relative min-h-[40px] border-l border-slate-800/50 p-1"
                      >
                        {dayEvents.map((ev) => (
                          <div
                            key={ev.id}
                            className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-xs text-cyan-300"
                            title={ev.title}
                          >
                            {ev.title}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Blocked dates list */}
          {blockedDates.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">{t("blockedDates")}</h3>
              {blockedDates.map((bd) => (
                <div
                  key={bd.id}
                  className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/5 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-red-300">
                      {bd.blocked_date}
                    </p>
                    {bd.reason && (
                      <p className="text-xs text-slate-400">{bd.reason}</p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleDeleteBlocked(bd.id)}
                    variant="ghost"
                    size="icon"
                    className="text-red-400 hover:bg-red-500/10"
                    aria-label={t("unblockDate")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BlockDateForm({
  onCancel,
  onSaved,
}: {
  onCancel: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("dashboard");
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BlockedDateForm>({
    resolver: zodResolver(blockedDateSchema),
  });

  const onSubmit = async (data: BlockedDateForm) => {
    setSaving(true);
    try {
      await centerApi.createBlockedDate({
        blocked_date: data.blocked_date,
        reason: data.reason,
      });
      toast.success(t("dateBlocked"));
      onSaved();
    } catch {
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">{t("blockDates")}</h3>
        <Button
          onClick={onCancel}
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap gap-4">
        <div>
          <label className="mb-1 block text-xs text-slate-400">
            {t("date")}
          </label>
          <Input
            {...register("blocked_date")}
            type="date"
            className="bg-slate-800 border-slate-700 text-white"
          />
          {errors.blocked_date && (
            <p className="mt-1 text-xs text-red-400">{errors.blocked_date.message}</p>
          )}
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs text-slate-400">
            {t("reason")}
          </label>
          <Input
            {...register("reason")}
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <div className="flex items-end">
          <Button
            type="submit"
            disabled={saving}
            variant="destructive"
          >
            {saving ? "..." : t("blockDates")}
          </Button>
        </div>
      </form>
    </div>
  );
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}
