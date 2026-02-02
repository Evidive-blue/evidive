"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DaySlot } from "./DaySlot";
import { SlotDetailsModal } from "./SlotDetailsModal";
import { BlockDateModal } from "./BlockDateModal";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  CalendarRange,
  List,
  LayoutGrid,
} from "lucide-react";

type ViewMode = "month" | "week" | "day";

interface BookingData {
  id: string;
  reference: string;
  diveDate: string;
  diveTime: string;
  participants: number;
  status: string;
  guestEmail: string;
  guestFirstName: string | null;
  guestLastName: string | null;
  service: {
    id: string;
    name: unknown;
    maxParticipants: number;
    durationMinutes: number;
  };
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
  } | null;
}

interface BlockedDateData {
  id: string;
  blockedDate: string;
  reason: string | null;
  allDay: boolean;
  blockedTimes: string[];
}

interface ServiceData {
  id: string;
  name: unknown;
  maxParticipants: number;
  startTimes: string[];
}

interface CenterData {
  id: string;
  slug: string;
  name: string;
  location: string;
}

interface CalendarViewProps {
  bookings: BookingData[];
  blockedDates: BlockedDateData[];
  services: ServiceData[];
  centers: CenterData[];
  selectedCenterId: string;
  currentYear: number;
  currentMonth: number;
  locale: string;
  translations: {
    title: string;
    subtitle: string;
    backToDashboard: string;
    selectCenter: string;
    monthView: string;
    weekView: string;
    dayView: string;
    today: string;
    previousMonth: string;
    nextMonth: string;
    previousWeek: string;
    nextWeek: string;
    previousDay: string;
    nextDay: string;
    noBookings: string;
    blockedDates: string;
    addBlockedDate: string;
    removeBlockedDate: string;
    blockDateTitle: string;
    blockDateReason: string;
    blockDateReasonPlaceholder: string;
    blockAllDay: string;
    blockSpecificTimes: string;
    cancel: string;
    confirm: string;
    slotDetails: string;
    service: string;
    dateTime: string;
    participants: string;
    placesRemaining: string;
    registeredParticipants: string;
    noParticipants: string;
    addManualBooking: string;
    closeSlot: string;
    status: Record<string, string>;
    days: Record<string, string>;
    daysShort: Record<string, string>;
    months: Record<string, string>;
    blockedDatesList: Record<string, string>;
    fillRate: Record<string, string>;
    responsive: {
      showCalendar: string;
      showList: string;
    };
    manualBookingForm?: {
      title: string;
      serviceLabel: string;
      selectService: string;
      dateLabel: string;
      timeLabel: string;
      participantsLabel: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      optional: string;
      submit: string;
      submitting: string;
      success: string;
      error: string;
      back: string;
    };
  };
}

function getLocalizedText(value: unknown, locale: string): string {
  if (!value || typeof value !== "object") return "";
  const obj = value as Record<string, unknown>;
  const direct = obj[locale];
  if (typeof direct === "string" && direct.trim().length > 0) return direct;
  const fallback = obj.fr;
  if (typeof fallback === "string" && fallback.trim().length > 0) return fallback;
  return "";
}

function getMonthDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Get start of week (Monday)
  const startOfWeek = new Date(firstDay);
  const dayOfWeek = firstDay.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday is 0
  startOfWeek.setDate(firstDay.getDate() - diff);

  // Get end of week
  const endOfWeek = new Date(lastDay);
  const endDayOfWeek = lastDay.getDay();
  const endDiff = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek;
  endOfWeek.setDate(lastDay.getDate() + endDiff);

  // Generate all days
  const current = new Date(startOfWeek);
  while (current <= endOfWeek) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

function getWeekDays(year: number, month: number, day: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, day);
  const dayOfWeek = date.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - diff);

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    days.push(d);
  }

  return days;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function isSameDay(d1: Date, d2: Date): boolean {
  return formatDate(d1) === formatDate(d2);
}

export function CalendarView({
  bookings,
  blockedDates,
  services,
  centers,
  selectedCenterId,
  currentYear,
  currentMonth,
  locale,
  translations: t,
}: CalendarViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [viewMode, setViewMode] = React.useState<ViewMode>("month");
  const [selectedDay, setSelectedDay] = React.useState<number>(new Date().getDate());
  const [mobileView, setMobileView] = React.useState<"calendar" | "list">("calendar");
  
  // Modal states
  const [selectedSlot, setSelectedSlot] = React.useState<{
    date: Date;
    time: string | null;
    bookings: BookingData[];
    service: ServiceData | null;
  } | null>(null);
  const [showBlockModal, setShowBlockModal] = React.useState(false);
  const [dateToBlock, setDateToBlock] = React.useState<Date | null>(null);

  const monthNames = Object.values(t.months);
  const dayNames = Object.values(t.daysShort);

  // Calculate days based on view mode
  const days = React.useMemo(() => {
    if (viewMode === "month") {
      return getMonthDays(currentYear, currentMonth);
    } else if (viewMode === "week") {
      return getWeekDays(currentYear, currentMonth, selectedDay);
    } else {
      return [new Date(currentYear, currentMonth, selectedDay)];
    }
  }, [viewMode, currentYear, currentMonth, selectedDay]);

  // Group bookings by date and time
  const bookingsByDateAndTime = React.useMemo(() => {
    const map = new Map<string, Map<string, BookingData[]>>();
    
    for (const booking of bookings) {
      const dateKey = booking.diveDate.split("T")[0];
      const timeKey = new Date(booking.diveTime).toTimeString().slice(0, 5);
      
      if (!map.has(dateKey)) {
        map.set(dateKey, new Map());
      }
      const dateMap = map.get(dateKey)!;
      
      if (!dateMap.has(timeKey)) {
        dateMap.set(timeKey, []);
      }
      dateMap.get(timeKey)!.push(booking);
    }
    
    return map;
  }, [bookings]);

  // Map blocked dates
  const blockedDatesMap = React.useMemo(() => {
    const map = new Map<string, BlockedDateData>();
    for (const bd of blockedDates) {
      const dateKey = bd.blockedDate.split("T")[0];
      map.set(dateKey, bd);
    }
    return map;
  }, [blockedDates]);

  // Navigation handlers
  const navigatePrevious = () => {
    if (viewMode === "month") {
      const newMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const newYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const params = new URLSearchParams(searchParams.toString());
      params.set("month", String(newMonth + 1));
      params.set("year", String(newYear));
      router.push(`?${params.toString()}`);
    } else if (viewMode === "week") {
      const date = new Date(currentYear, currentMonth, selectedDay - 7);
      const params = new URLSearchParams(searchParams.toString());
      params.set("month", String(date.getMonth() + 1));
      params.set("year", String(date.getFullYear()));
      setSelectedDay(date.getDate());
      router.push(`?${params.toString()}`);
    } else {
      const date = new Date(currentYear, currentMonth, selectedDay - 1);
      const params = new URLSearchParams(searchParams.toString());
      params.set("month", String(date.getMonth() + 1));
      params.set("year", String(date.getFullYear()));
      setSelectedDay(date.getDate());
      router.push(`?${params.toString()}`);
    }
  };

  const navigateNext = () => {
    if (viewMode === "month") {
      const newMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const newYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const params = new URLSearchParams(searchParams.toString());
      params.set("month", String(newMonth + 1));
      params.set("year", String(newYear));
      router.push(`?${params.toString()}`);
    } else if (viewMode === "week") {
      const date = new Date(currentYear, currentMonth, selectedDay + 7);
      const params = new URLSearchParams(searchParams.toString());
      params.set("month", String(date.getMonth() + 1));
      params.set("year", String(date.getFullYear()));
      setSelectedDay(date.getDate());
      router.push(`?${params.toString()}`);
    } else {
      const date = new Date(currentYear, currentMonth, selectedDay + 1);
      const params = new URLSearchParams(searchParams.toString());
      params.set("month", String(date.getMonth() + 1));
      params.set("year", String(date.getFullYear()));
      setSelectedDay(date.getDate());
      router.push(`?${params.toString()}`);
    }
  };

  const goToToday = () => {
    const today = new Date();
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", String(today.getMonth() + 1));
    params.set("year", String(today.getFullYear()));
    setSelectedDay(today.getDate());
    router.push(`?${params.toString()}`);
  };

  const handleCenterChange = (centerId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("centerId", centerId);
    router.push(`?${params.toString()}`);
  };

  const handleDayClick = (date: Date) => {
    const dateKey = formatDate(date);
    const dayBookings = bookingsByDateAndTime.get(dateKey);
    const blocked = blockedDatesMap.get(dateKey);
    
    if (blocked?.allDay) {
      // Show blocked info
      setDateToBlock(date);
      setShowBlockModal(true);
      return;
    }

    // If there are bookings, show details modal
    if (dayBookings && dayBookings.size > 0) {
      // Get all bookings for the day
      const allBookings: BookingData[] = [];
      dayBookings.forEach((b) => allBookings.push(...b));
      
      setSelectedSlot({
        date,
        time: null,
        bookings: allBookings,
        service: null,
      });
    } else {
      // Open block modal
      setDateToBlock(date);
      setShowBlockModal(true);
    }
  };

  const handleSlotClick = (date: Date, time: string, slotBookings: BookingData[]) => {
    const service = slotBookings.length > 0
      ? services.find((s) => s.id === slotBookings[0].service.id) || null
      : null;
    
    setSelectedSlot({
      date,
      time,
      bookings: slotBookings,
      service,
    });
  };

  const handleBlockDate = (date: Date) => {
    setDateToBlock(date);
    setShowBlockModal(true);
  };

  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;

  return (
    <>
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader className="border-b border-white/10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-cyan-400" />
              <CardTitle className="text-lg text-white">
                {monthNames[currentMonth]} {currentYear}
              </CardTitle>
            </div>

            {/* Center selector */}
            {centers.length > 1 && (
              <select
                value={selectedCenterId}
                onChange={(e) => handleCenterChange(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white backdrop-blur-xl focus:border-cyan-500/50 focus:outline-none"
              >
                {centers.map((center) => (
                  <option key={center.id} value={center.id} className="bg-slate-900">
                    {center.name}
                  </option>
                ))}
              </select>
            )}

            {/* View mode toggle */}
            <div className="flex items-center gap-2">
              <div className="hidden rounded-xl border border-white/10 bg-white/5 p-1 sm:flex">
                <button
                  onClick={() => setViewMode("month")}
                  className={cn(
                    "rounded-lg p-2 transition",
                    viewMode === "month"
                      ? "bg-cyan-500/20 text-cyan-300"
                      : "text-white/60 hover:text-white"
                  )}
                  title={t.monthView}
                >
                  <CalendarDays className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("week")}
                  className={cn(
                    "rounded-lg p-2 transition",
                    viewMode === "week"
                      ? "bg-cyan-500/20 text-cyan-300"
                      : "text-white/60 hover:text-white"
                  )}
                  title={t.weekView}
                >
                  <CalendarRange className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("day")}
                  className={cn(
                    "rounded-lg p-2 transition",
                    viewMode === "day"
                      ? "bg-cyan-500/20 text-cyan-300"
                      : "text-white/60 hover:text-white"
                  )}
                  title={t.dayView}
                >
                  <Calendar className="h-4 w-4" />
                </button>
              </div>

              {/* Mobile view toggle */}
              <div className="flex rounded-xl border border-white/10 bg-white/5 p-1 sm:hidden">
                <button
                  onClick={() => setMobileView("calendar")}
                  className={cn(
                    "rounded-lg p-2 transition",
                    mobileView === "calendar"
                      ? "bg-cyan-500/20 text-cyan-300"
                      : "text-white/60 hover:text-white"
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setMobileView("list")}
                  className={cn(
                    "rounded-lg p-2 transition",
                    mobileView === "list"
                      ? "bg-cyan-500/20 text-cyan-300"
                      : "text-white/60 hover:text-white"
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-1">
                <button
                  onClick={navigatePrevious}
                  className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={goToToday}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                    isCurrentMonth
                      ? "bg-cyan-500/20 text-cyan-300"
                      : "text-white/60 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {t.today}
                </button>
                <button
                  onClick={navigateNext}
                  className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          {/* Desktop: Calendar Grid */}
          <div className={cn("hidden sm:block", mobileView === "list" && "sm:hidden md:block")}>
            {/* Day headers */}
            <div className="mb-2 grid grid-cols-7 gap-1">
              {dayNames.map((day, i) => (
                <div
                  key={i}
                  className="py-2 text-center text-xs font-medium uppercase text-white/50"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((date, i) => {
                const dateKey = formatDate(date);
                const isCurrentMonthDay = date.getMonth() === currentMonth;
                const isToday = isSameDay(date, today);
                const dayBookingsMap = bookingsByDateAndTime.get(dateKey);
                const blocked = blockedDatesMap.get(dateKey);

                // Calculate total participants and max capacity for the day
                let totalParticipants = 0;
                let totalCapacity = 0;

                if (dayBookingsMap) {
                  dayBookingsMap.forEach((slotBookings) => {
                    // For each slot, count participants and capacity
                    let slotParticipants = 0;
                    let slotCapacity = 0;
                    
                    slotBookings.forEach((b) => {
                      slotParticipants += b.participants;
                      // Use the max capacity of the service for this slot
                      slotCapacity = Math.max(slotCapacity, b.service.maxParticipants);
                    });
                    
                    totalParticipants += slotParticipants;
                    totalCapacity += slotCapacity;
                  });
                }

                // If no bookings, estimate capacity from services (average per day)
                if (totalCapacity === 0 && services.length > 0) {
                  // Use the average max participants across services
                  const avgCapacity = Math.round(
                    services.reduce((sum, s) => sum + s.maxParticipants, 0) / services.length
                  );
                  totalCapacity = avgCapacity;
                }

                return (
                  <DaySlot
                    key={i}
                    date={date}
                    isCurrentMonth={isCurrentMonthDay}
                    isToday={isToday}
                    isBlocked={blocked?.allDay || false}
                    blockedTimes={blocked?.blockedTimes || []}
                    totalParticipants={totalParticipants}
                    totalCapacity={totalCapacity}
                    bookingsCount={dayBookingsMap?.size || 0}
                    locale={locale}
                    translations={t}
                    onClick={() => handleDayClick(date)}
                    onBlockClick={() => handleBlockDate(date)}
                  />
                );
              })}
            </div>
          </div>

          {/* Mobile: List View */}
          <div className={cn("sm:hidden", mobileView === "calendar" && "hidden")}>
            {days
              .filter((date) => date.getMonth() === currentMonth)
              .map((date, i) => {
                const dateKey = formatDate(date);
                const dayBookingsMap = bookingsByDateAndTime.get(dateKey);
                const blocked = blockedDatesMap.get(dateKey);
                const isToday = isSameDay(date, today);

                if (!dayBookingsMap && !blocked?.allDay) return null;

                return (
                  <div
                    key={i}
                    className={cn(
                      "mb-3 rounded-xl border p-3",
                      isToday
                        ? "border-cyan-500/30 bg-cyan-500/5"
                        : "border-white/10 bg-white/5"
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="font-medium text-white">
                        {date.toLocaleDateString(locale, {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </div>
                      {blocked?.allDay && (
                        <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs text-red-300">
                          {t.blockedDates}
                        </span>
                      )}
                    </div>

                    {dayBookingsMap && (
                      <div className="space-y-2">
                        {Array.from(dayBookingsMap.entries()).map(([time, slotBookings]) => {
                          const totalPax = slotBookings.reduce(
                            (sum, b) => sum + b.participants,
                            0
                          );
                          const service = services.find(
                            (s) => s.id === slotBookings[0].service.id
                          );
                          const serviceName = service
                            ? getLocalizedText(service.name, locale)
                            : "";

                          return (
                            <button
                              key={time}
                              onClick={() => handleSlotClick(date, time, slotBookings)}
                              className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 p-2 text-left transition hover:bg-white/10"
                            >
                              <div>
                                <div className="text-sm font-medium text-white">
                                  {time} - {serviceName}
                                </div>
                                <div className="text-xs text-white/60">
                                  {totalPax} {t.participants}
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-white/40" />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {!dayBookingsMap && blocked?.allDay && (
                      <p className="text-sm text-white/50">
                        {blocked.reason || t.blockedDatesList.noReason}
                      </p>
                    )}
                  </div>
                );
              })}

            {days.filter((d) => d.getMonth() === currentMonth).length === 0 && (
              <div className="py-8 text-center text-white/50">{t.noBookings}</div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 border-t border-white/10 pt-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-white/60">{t.fillRate.low} (&lt;50%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <span className="text-xs text-white/60">{t.fillRate.medium} (50-80%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-xs text-white/60">{t.fillRate.high} (&gt;80%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-slate-600" />
              <span className="text-xs text-white/60">{t.blockedDates}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Slot Details Modal */}
      {selectedSlot && (
        <SlotDetailsModal
          isOpen={!!selectedSlot}
          onClose={() => setSelectedSlot(null)}
          date={selectedSlot.date}
          time={selectedSlot.time}
          bookings={selectedSlot.bookings}
          service={selectedSlot.service}
          centerId={selectedCenterId}
          services={services}
          locale={locale}
          translations={t}
        />
      )}

      {/* Block Date Modal */}
      {showBlockModal && dateToBlock && (
        <BlockDateModal
          isOpen={showBlockModal}
          onClose={() => {
            setShowBlockModal(false);
            setDateToBlock(null);
          }}
          date={dateToBlock}
          centerId={selectedCenterId}
          existingBlock={blockedDatesMap.get(formatDate(dateToBlock))}
          locale={locale}
          translations={t}
        />
      )}
    </>
  );
}
