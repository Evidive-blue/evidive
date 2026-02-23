"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { toast } from "sonner";
import { adminApi, type CalendarEvent, type PublicCenter } from "@/lib/api";
import { Filter, Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";

type ViewMode = "month" | "week" | "day" | "list";

const HOUR_START = 7;
const HOUR_END = 21;

function toYMD(d: Date): string {
  return d.toISOString().split("T")[0] ?? "";
}

function getMonthRange(d: Date): { from: string; to: string } {
  const y = d.getFullYear();
  const m = d.getMonth();
  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);
  return { from: toYMD(first), to: toYMD(last) };
}

function getWeekRange(d: Date): { from: string; to: string } {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: toYMD(monday), to: toYMD(sunday) };
}

function getDayRange(d: Date): { from: string; to: string } {
  const s = toYMD(d);
  return { from: s, to: s };
}

function addMonths(d: Date, n: number): Date {
  const out = new Date(d);
  out.setMonth(out.getMonth() + n);
  return out;
}

function addWeeks(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n * 7);
  return out;
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const m = new Date(d);
  m.setDate(diff);
  return m;
}

function getMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const start = getMonday(first);
  const end = new Date(getMonday(last));
  end.setDate(end.getDate() + 6);
  const days: Date[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function getWeekDays(centerDate: Date): Date[] {
  const monday = getMonday(centerDate);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

function getEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  const key = toYMD(date);
  return events.filter((e) => {
    const d = new Date(e.start_time).toISOString().split("T")[0];
    return d === key;
  });
}

function getEventTypeColor(type: string): string {
  switch (type) {
    case "booking":
      return "bg-cyan-500";
    case "blocked":
      return "bg-red-500";
    case "holiday":
      return "bg-amber-500";
    default:
      return "bg-slate-500";
  }
}

function getEventTypeBg(type: string): string {
  switch (type) {
    case "booking":
      return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
    case "blocked":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "holiday":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    default:
      return "bg-slate-500/20 text-slate-300 border-slate-600";
  }
}

export function AdminPlanningsClient() {
  const t = useTranslations("admin");
  const tDashboard = useTranslations("dashboard");
  const format = useFormatter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [centers, setCenters] = useState<PublicCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [centerId, setCenterId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [view, setView] = useState<ViewMode>("list");
  const [viewDate, setViewDate] = useState<Date>(() => new Date());

  const loadCenters = useCallback(async () => {
    try {
      const data = await adminApi.getCenters();
      setCenters(data);
    } catch {
      toast.error(t("loadError"));
    }
  }, [t]);

  const loadEvents = useCallback(async (params: {
    center_id?: string;
    date_from?: string;
    date_to?: string;
  } = {}) => {
    setLoading(true);
    try {
      const data = await adminApi.getPlannings(params);
      setEvents(data);
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadCenters();
  }, [loadCenters]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleFilter = () => {
    const params: {
      center_id?: string;
      date_from?: string;
      date_to?: string;
    } = {};
    if (centerId) {
      params.center_id = centerId;
    }
    if (dateFrom) {
      params.date_from = dateFrom;
    }
    if (dateTo) {
      params.date_to = dateTo;
    }
    loadEvents(params);
  };

  const navigateAndLoad = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
    loadEvents({ center_id: centerId || undefined, date_from: from, date_to: to });
  };

  const handlePrevPeriod = () => {
    if (view === "month") {
      const next = addMonths(viewDate, -1);
      setViewDate(next);
      const { from, to } = getMonthRange(next);
      navigateAndLoad(from, to);
    } else if (view === "week") {
      const next = addWeeks(viewDate, -1);
      setViewDate(next);
      const { from, to } = getWeekRange(next);
      navigateAndLoad(from, to);
    } else if (view === "day") {
      const next = addDays(viewDate, -1);
      setViewDate(next);
      const { from, to } = getDayRange(next);
      navigateAndLoad(from, to);
    }
  };

  const handleNextPeriod = () => {
    if (view === "month") {
      const next = addMonths(viewDate, 1);
      setViewDate(next);
      const { from, to } = getMonthRange(next);
      navigateAndLoad(from, to);
    } else if (view === "week") {
      const next = addWeeks(viewDate, 1);
      setViewDate(next);
      const { from, to } = getWeekRange(next);
      navigateAndLoad(from, to);
    } else if (view === "day") {
      const next = addDays(viewDate, 1);
      setViewDate(next);
      const { from, to } = getDayRange(next);
      navigateAndLoad(from, to);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setViewDate(today);
    if (view === "month") {
      const { from, to } = getMonthRange(today);
      navigateAndLoad(from, to);
    } else if (view === "week") {
      const { from, to } = getWeekRange(today);
      navigateAndLoad(from, to);
    } else if (view === "day") {
      const { from, to } = getDayRange(today);
      navigateAndLoad(from, to);
    }
  };

  const handleSelectDay = (d: Date) => {
    setViewDate(d);
    setView("day");
    const { from, to } = getDayRange(d);
    navigateAndLoad(from, to);
  };

  const handleSwitchToMonth = () => {
    setView("month");
    if (!dateFrom) {
      const { from, to } = getMonthRange(viewDate);
      setDateFrom(from);
      setDateTo(to);
    }
  };

  const handleSwitchToWeek = () => {
    setView("week");
    if (!dateFrom) {
      const { from, to } = getWeekRange(viewDate);
      setDateFrom(from);
      setDateTo(to);
    }
  };

  const handleSwitchToDay = () => {
    setView("day");
    if (!dateFrom) {
      const { from, to } = getDayRange(viewDate);
      setDateFrom(from);
      setDateTo(to);
    }
  };

  const formatTime = (timeString: string): string =>
    format.dateTime(new Date(timeString), {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDate = (dateString: string): string =>
    format.dateTime(new Date(dateString), {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  const formatMonthYear = (d: Date): string =>
    format.dateTime(d, { month: "long", year: "numeric" });

  const formatWeekRange = (d: Date): string => {
    const { from, to } = getWeekRange(d);
    const fromD = new Date(from);
    const toD = new Date(to);
    return `${fromD.getDate()} - ${toD.getDate()} ${format.dateTime(toD, { month: "short", year: "numeric" })}`;
  };

  const formatDayHeader = (d: Date): string =>
    format.dateTime(d, {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  const groupEventsByDate = () => {
    const grouped: Record<string, CalendarEvent[]> = {};
    events.forEach((event) => {
      const dateKey = new Date(event.start_time).toISOString().split("T")[0];
      if (dateKey) {
        (grouped[dateKey] ??= []).push(event);
      }
    });
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      booking: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      blocked: "bg-red-500/10 text-red-400 border-red-500/20",
      holiday: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    };
    return styles[type] || "bg-slate-700 text-slate-300 border-slate-600";
  };

  const getTypeLabel = (type: string) => {
    if (type === "booking") {return t("booking");}
    if (type === "blocked") {return t("blocked");}
    if (type === "holiday") {return t("holiday");}
    return type;
  };

  const groupedEvents = groupEventsByDate();
  const todayYMD = toYMD(new Date());

  const weekDayNames = [
    tDashboard("monday"),
    tDashboard("tuesday"),
    tDashboard("wednesday"),
    tDashboard("thursday"),
    tDashboard("friday"),
    tDashboard("saturday"),
    tDashboard("sunday"),
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-100">{t("plannings")}</h2>

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex flex-wrap items-end gap-4">
          {/* Center Selector */}
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-sm text-slate-400">
              {t("center")}
            </label>
            <select
              value={centerId}
              onChange={(e) => setCenterId(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 transition-colors hover:border-slate-600 focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              <option value="">{t("all")}</option>
              {centers.map((center) => (
                <option key={center.id} value={center.id}>
                  {center.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-sm text-slate-400">
              {t("dateFrom")}
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 transition-colors hover:border-slate-600 focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            />
          </div>

          {/* Date To */}
          <div className="min-w-[200px] flex-1">
            <label className="mb-1 block text-sm text-slate-400">
              {t("dateTo")}
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 transition-colors hover:border-slate-600 focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            />
          </div>

          {/* Filter Button */}
          <div>
            <button
              onClick={handleFilter}
              className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-cyan-700"
            >
              <Filter className="h-4 w-4" />
              {t("filter")}
            </button>
          </div>
        </div>
      </div>

      {/* View Toggle & Navigation */}
      {(view === "month" || view === "week" || view === "day") && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/95 p-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevPeriod}
              className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 transition-colors hover:bg-slate-700 hover:text-slate-100"
              aria-label={t("previousPeriod")}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNextPeriod}
              className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 transition-colors hover:bg-slate-700 hover:text-slate-100"
              aria-label={t("nextPeriod")}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-slate-100"
            >
              {t("today")}
            </button>
            <span className="ml-2 text-sm font-medium text-slate-200">
              {view === "month" && formatMonthYear(viewDate)}
              {view === "week" && formatWeekRange(viewDate)}
              {view === "day" && formatDayHeader(viewDate)}
            </span>
          </div>
        </div>
      )}

      {/* View Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSwitchToMonth}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            view === "month"
              ? "bg-cyan-600 text-slate-100"
              : "border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700"
          }`}
        >
          {t("viewMonth")}
        </button>
        <button
          type="button"
          onClick={handleSwitchToWeek}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            view === "week"
              ? "bg-cyan-600 text-slate-100"
              : "border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700"
          }`}
        >
          {t("viewWeek")}
        </button>
        <button
          type="button"
          onClick={handleSwitchToDay}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            view === "day"
              ? "bg-cyan-600 text-slate-100"
              : "border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700"
          }`}
        >
          {t("viewDay")}
        </button>
        <button
          type="button"
          onClick={() => setView("list")}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            view === "list"
              ? "bg-cyan-600 text-slate-100"
              : "border border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700"
          }`}
        >
          {t("viewList")}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
      ) : view === "month" ? (
        <MonthView
          viewDate={viewDate}
          events={events}
          todayYMD={todayYMD}
          weekDayNames={weekDayNames}
          getEventTypeColor={getEventTypeColor}
          onDayClick={handleSelectDay}
        />
      ) : view === "week" ? (
        <WeekView
          viewDate={viewDate}
          events={events}
          todayYMD={todayYMD}
          weekDayNames={weekDayNames}
          getEventTypeBg={getEventTypeBg}
          formatTime={formatTime}
          getTypeLabel={getTypeLabel}
        />
      ) : view === "day" ? (
        <DayView
          viewDate={viewDate}
          events={events}
          getEventTypeBg={getEventTypeBg}
          formatTime={formatTime}
          getTypeLabel={getTypeLabel}
        />
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
          <Calendar className="mx-auto mb-4 h-12 w-12 text-slate-600" />
          <p className="text-sm text-slate-500">{t("noResults")}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedEvents.map(([date, dateEvents]) => (
            <div
              key={date}
              className="rounded-xl border border-slate-800 bg-slate-900"
            >
              <div className="border-b border-slate-800 bg-slate-800/50 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-300">
                  {formatDate(date)}
                </h3>
              </div>
              <div className="divide-y divide-slate-800">
                {dateEvents.map((event) => (
                  <div
                    key={event.id}
                    className="px-4 py-3 transition-colors hover:bg-slate-800/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <span
                            className={`rounded-full border px-2 py-1 text-xs font-medium ${getTypeBadge(event.type)}`}
                          >
                            {getTypeLabel(event.type)}
                          </span>
                          {event.booking_id && (
                            <span className="text-xs text-slate-500">
                              {t("bookingId")}: {event.booking_id.slice(0, 8)}...
                            </span>
                          )}
                        </div>
                        <h4 className="mb-1 text-sm font-medium text-slate-200">
                          {event.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {formatTime(event.start_time)} -{" "}
                            {formatTime(event.end_time)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MonthView({
  viewDate,
  events,
  todayYMD,
  weekDayNames,
  getEventTypeColor,
  onDayClick,
}: {
  viewDate: Date;
  events: CalendarEvent[];
  todayYMD: string;
  weekDayNames: string[];
  getEventTypeColor: (type: string) => string;
  onDayClick: (d: Date) => void;
}) {
  const days = getMonthGrid(viewDate.getFullYear(), viewDate.getMonth());

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/95">
      <div className="grid grid-cols-7 border-b border-slate-800">
        {weekDayNames.map((name) => (
          <div
            key={name}
            className="border-r border-slate-800 px-2 py-2 text-center text-xs font-medium text-slate-400 last:border-r-0"
          >
            {name}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const key = toYMD(d);
          const dayEvents = getEventsForDate(events, d);
          const isToday = key === todayYMD;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onDayClick(d)}
              className={`min-h-[80px] border-b border-r border-slate-800 p-2 text-left transition-colors hover:bg-slate-800/50 last:border-r-0 ${
                isToday ? "border-cyan-500 bg-cyan-500/5" : "bg-slate-900/50"
              }`}
            >
              <span
                className={`text-sm ${isToday ? "font-bold text-cyan-400" : "text-slate-300"}`}
              >
                {d.getDate()}
              </span>
              <div className="mt-1 flex flex-wrap gap-1">
                {dayEvents.slice(0, 3).map((e) => (
                  <span
                    key={e.id}
                    className={`inline-block h-2 w-2 shrink-0 rounded-full ${getEventTypeColor(e.type)}`}
                    title={e.title}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <span className="text-xs text-slate-500">
                    +{dayEvents.length - 3}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({
  viewDate,
  events,
  todayYMD,
  weekDayNames,
  getEventTypeBg,
  formatTime,
  getTypeLabel,
}: {
  viewDate: Date;
  events: CalendarEvent[];
  todayYMD: string;
  weekDayNames: string[];
  getEventTypeBg: (type: string) => string;
  formatTime: (s: string) => string;
  getTypeLabel: (type: string) => string;
}) {
  const weekDays = getWeekDays(viewDate);
  const hours = Array.from(
    { length: HOUR_END - HOUR_START + 1 },
    (_, i) => HOUR_START + i,
  );

  const gridStart = HOUR_START * 60;

  function getEventPosition(e: CalendarEvent): {
    top: number;
    height: number;
    col: number;
  } {
    const start = new Date(e.start_time);
    const end = new Date(e.end_time);
    const eventDateKey = toYMD(start);
    const col = weekDays.findIndex((wd) => toYMD(wd) === eventDateKey);
    if (col < 0) {return { top: 0, height: 0, col: -1 };}
    const topMin = start.getHours() * 60 + start.getMinutes() - gridStart;
    const endMin = end.getHours() * 60 + end.getMinutes() - gridStart;
    const height = Math.max(20, endMin - topMin);
    return { top: topMin, height, col };
  }

  const eventsByCol = weekDays.map((_, col) =>
    events.filter((e) => {
      const d = new Date(e.start_time).toISOString().split("T")[0];
      const day = weekDays[col];
      if (!day) {return false;}
      const dayKey = toYMD(day);
      return d === dayKey;
    }),
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/95">
      <div className="grid min-w-[800px] grid-cols-8">
        <div className="border-b border-r border-slate-800 bg-slate-800/50" />
        {weekDays.map((d, i) => {
          const key = toYMD(d);
          const isToday = key === todayYMD;
          return (
            <div
              key={key}
              className={`border-b border-r border-slate-800 px-2 py-2 text-center text-xs font-medium last:border-r-0 ${
                isToday ? "bg-cyan-500/10 text-cyan-400" : "text-slate-400"
              }`}
            >
              <div>{weekDayNames[i]}</div>
              <div className="font-semibold text-slate-200">{d.getDate()}</div>
            </div>
          );
        })}
      </div>
      <div className="grid min-w-[800px] grid-cols-8">
        <div className="border-r border-slate-800 bg-slate-800/30">
          {hours.map((h) => (
            <div
              key={h}
              className="h-14 border-b border-slate-800/50 px-2 text-xs text-slate-500"
            >
              {h.toString().padStart(2, "0")}:00
            </div>
          ))}
        </div>
        {weekDays.map((d, colIdx) => {
          const key = toYMD(d);
          const isToday = key === todayYMD;
          const colEvents = eventsByCol[colIdx] ?? [];

          return (
            <div
              key={key}
              className={`relative border-r border-slate-800 last:border-r-0 ${
                isToday ? "bg-cyan-500/5" : ""
              }`}
            >
              <div
                className="absolute inset-0 h-[var(--grid-h)]"
                style={{ '--grid-h': `${(HOUR_END - HOUR_START + 1) * 56}px` } as React.CSSProperties}
              >
                {hours.map((h) => (
                  <div
                    key={h}
                    className="h-14 border-b border-slate-800/30"
                  />
                ))}
              </div>
              {colEvents.map((e) => {
                const pos = getEventPosition(e);
                if (pos.col !== colIdx) {return null;}
                return (
                  <div
                    key={e.id}
                    className={`absolute left-1 right-1 overflow-hidden rounded border text-xs top-[var(--evt-top)] h-[var(--evt-h)] ${getEventTypeBg(e.type)}`}
                    style={{ '--evt-top': `${pos.top * (56 / 60)}px`, '--evt-h': `${pos.height * (56 / 60)}px` } as React.CSSProperties}
                  >
                    <div className="truncate font-medium">{e.title}</div>
                    <div className="text-[10px] opacity-90">
                      {formatTime(e.start_time)} - {formatTime(e.end_time)}
                    </div>
                    <span className="rounded px-1 text-[10px]">
                      {getTypeLabel(e.type)}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayView({
  viewDate,
  events,
  getEventTypeBg,
  formatTime,
  getTypeLabel,
}: {
  viewDate: Date;
  events: CalendarEvent[];
  getEventTypeBg: (type: string) => string;
  formatTime: (s: string) => string;
  getTypeLabel: (type: string) => string;
}) {
  const key = toYMD(viewDate);
  const dayEvents = getEventsForDate(events, viewDate);
  const hours = Array.from(
    { length: HOUR_END - HOUR_START + 1 },
    (_, i) => HOUR_START + i,
  );
  const gridStart = HOUR_START * 60;
  const PX_PER_MIN = 56 / 60;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/95">
      <div className="border-b border-slate-800 bg-slate-800/50 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-200">{key}</h3>
      </div>
      <div className="grid grid-cols-[60px_1fr]">
        <div className="border-r border-slate-800 bg-slate-800/30">
          {hours.map((h) => (
            <div
              key={h}
              className="h-14 border-b border-slate-800/50 px-2 text-xs text-slate-500"
            >
              {h.toString().padStart(2, "0")}:00
            </div>
          ))}
        </div>
        <div
          className="relative min-h-[var(--grid-min-h)]"
          style={{ '--grid-min-h': `${(HOUR_END - HOUR_START + 1) * 56}px` } as React.CSSProperties}
        >
          {hours.map((h) => (
            <div
              key={h}
              className="absolute left-0 right-0 h-14 border-b border-slate-800/30 top-[var(--hour-top)]"
              style={{ '--hour-top': `${(h - HOUR_START) * 56}px` } as React.CSSProperties}
            />
          ))}
          {dayEvents.map((e) => {
            const start = new Date(e.start_time);
            const end = new Date(e.end_time);
            const topMin =
              start.getHours() * 60 + start.getMinutes() - gridStart;
            const endMin =
              end.getHours() * 60 + end.getMinutes() - gridStart;
            const height = Math.max(40, (endMin - topMin) * PX_PER_MIN);

            return (
              <div
                key={e.id}
                className={`absolute left-2 right-2 overflow-hidden rounded border p-2 text-xs top-[var(--evt-top)] h-[var(--evt-h)] ${getEventTypeBg(e.type)}`}
                style={{ '--evt-top': `${topMin * PX_PER_MIN}px`, '--evt-h': `${height}px` } as React.CSSProperties}
              >
                <div className="font-medium">{e.title}</div>
                <div className="mt-1 opacity-90">
                  {formatTime(e.start_time)} - {formatTime(e.end_time)}
                </div>
                <span className="mt-1 inline-block rounded px-1.5 py-0.5 text-[10px]">
                  {getTypeLabel(e.type)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
