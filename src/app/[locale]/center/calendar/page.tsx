import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CalendarView } from "@/components/center/calendar/CalendarView";
import { BlockedDatesList } from "@/components/center/calendar/BlockedDatesList";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";

type LocalizedJson = Record<string, unknown>;

function getLocalizedText(value: unknown, locale: string): string {
  if (!value || typeof value !== "object") return "";
  const obj = value as LocalizedJson;
  const direct = obj[locale];
  if (typeof direct === "string" && direct.trim().length > 0) return direct;
  const fallback = obj.fr;
  if (typeof fallback === "string" && fallback.trim().length > 0) return fallback;
  const en = obj.en;
  if (typeof en === "string" && en.trim().length > 0) return en;
  for (const key of Object.keys(obj)) {
    const v = obj[key];
    if (typeof v === "string" && v.trim().length > 0) return v;
  }
  return "";
}

export default async function CenterCalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string; year?: string; centerId?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  const { month: monthParam, year: yearParam, centerId: centerIdParam } = await searchParams;
  
  const session = await auth();
  const t = await getTranslations({ locale, namespace: "centerCalendar" });

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  const userType = session.user.userType;
  if (userType !== "CENTER_OWNER" && userType !== "ADMIN") {
    redirect(`/${locale}/dashboard`);
  }

  // Get user's centers
  const centers = await prisma.diveCenter.findMany({
    where: userType === "ADMIN" 
      ? { status: "APPROVED" }
      : { ownerId: session.user.id, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      name: true,
      city: true,
      country: true,
    },
    take: 20,
  });

  if (centers.length === 0) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
            <h1 className="text-xl font-semibold text-white">{t("noCenters")}</h1>
            <p className="mt-2 text-sm text-white/60">{t("noCentersDesc")}</p>
            <Link
              href="/dashboard/center"
              className="mt-4 inline-block rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400"
            >
              {t("backToDashboard")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Selected center (default to first)
  const selectedCenterId = centerIdParam && centers.find(c => c.id === centerIdParam)
    ? centerIdParam
    : centers[0].id;

  const selectedCenter = centers.find(c => c.id === selectedCenterId)!;
  const centerName = getLocalizedText(selectedCenter.name, locale) || selectedCenter.slug;

  // Get current month/year or use params
  const now = new Date();
  const currentYear = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
  const currentMonth = monthParam ? parseInt(monthParam, 10) - 1 : now.getMonth(); // 0-indexed

  // Calculate start and end of month
  const startOfMonth = new Date(currentYear, currentMonth, 1);
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

  // Fetch bookings for the month
  const bookings = await prisma.booking.findMany({
    where: {
      centerId: selectedCenterId,
      diveDate: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
      status: { in: ["PENDING", "CONFIRMED", "PAID", "RUNNING", "COMPLETED"] },
    },
    include: {
      service: {
        select: {
          id: true,
          name: true,
          maxParticipants: true,
          durationMinutes: true,
          startTimes: true,
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          displayName: true,
        },
      },
    },
    orderBy: [{ diveDate: "asc" }, { diveTime: "asc" }],
  });

  // Fetch blocked dates
  const blockedDates = await prisma.centerBlockedDate.findMany({
    where: { centerId: selectedCenterId },
    orderBy: { blockedDate: "asc" },
  });

  // Get services for the center (for max participants info)
  const services = await prisma.diveService.findMany({
    where: { centerId: selectedCenterId, isActive: true },
    select: {
      id: true,
      name: true,
      maxParticipants: true,
      startTimes: true,
    },
  });

  // Transform bookings for client component
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookingsData = bookings.map((b: any) => ({
    id: b.id,
    reference: b.reference,
    diveDate: b.diveDate.toISOString(),
    diveTime: b.diveTime.toISOString(),
    participants: b.participants,
    status: b.status,
    guestEmail: b.guestEmail,
    guestFirstName: b.guestFirstName,
    guestLastName: b.guestLastName,
    service: {
      id: b.service.id,
      name: b.service.name,
      maxParticipants: b.service.maxParticipants,
      durationMinutes: b.service.durationMinutes,
    },
    user: b.user
      ? {
          id: b.user.id,
          email: b.user.email,
          firstName: b.user.firstName,
          lastName: b.user.lastName,
          displayName: b.user.displayName,
        }
      : null,
  }));

  const blockedDatesData = blockedDates.map((bd) => ({
    id: bd.id,
    blockedDate: bd.blockedDate.toISOString(),
    reason: bd.reason,
    allDay: bd.allDay,
    blockedTimes: bd.blockedTimes,
  }));

  const servicesData = services.map((s) => ({
    id: s.id,
    name: s.name,
    maxParticipants: s.maxParticipants,
    startTimes: s.startTimes,
  }));

  const centersData = centers.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: getLocalizedText(c.name, locale) || c.slug,
    location: [c.city, c.country].filter(Boolean).join(", "),
  }));

  // Translations for client component
  const translations = {
    title: t("title"),
    subtitle: t("subtitle"),
    backToDashboard: t("backToDashboard"),
    selectCenter: t("selectCenter"),
    monthView: t("monthView"),
    weekView: t("weekView"),
    dayView: t("dayView"),
    today: t("today"),
    previousMonth: t("previousMonth"),
    nextMonth: t("nextMonth"),
    previousWeek: t("previousWeek"),
    nextWeek: t("nextWeek"),
    previousDay: t("previousDay"),
    nextDay: t("nextDay"),
    noBookings: t("noBookings"),
    blockedDates: t("blockedDates"),
    addBlockedDate: t("addBlockedDate"),
    removeBlockedDate: t("removeBlockedDate"),
    blockDateTitle: t("blockDateTitle"),
    blockDateReason: t("blockDateReason"),
    blockDateReasonPlaceholder: t("blockDateReasonPlaceholder"),
    blockAllDay: t("blockAllDay"),
    blockSpecificTimes: t("blockSpecificTimes"),
    blockType: t("blockType"),
    slotsToBlock: t("slotsToBlock"),
    cancel: t("cancel"),
    confirm: t("confirm"),
    slotDetails: t("slotDetails"),
    service: t("service"),
    dateTime: t("dateTime"),
    participants: t("participants"),
    placesRemaining: t("placesRemaining"),
    registeredParticipants: t("registeredParticipants"),
    noParticipants: t("noParticipants"),
    addManualBooking: t("addManualBooking"),
    closeSlot: t("closeSlot"),
    status: {
      PENDING: t("status.PENDING"),
      CONFIRMED: t("status.CONFIRMED"),
      PAID: t("status.PAID"),
      RUNNING: t("status.RUNNING"),
      COMPLETED: t("status.COMPLETED"),
      CANCELLED: t("status.CANCELLED"),
    },
    days: {
      monday: t("days.monday"),
      tuesday: t("days.tuesday"),
      wednesday: t("days.wednesday"),
      thursday: t("days.thursday"),
      friday: t("days.friday"),
      saturday: t("days.saturday"),
      sunday: t("days.sunday"),
    },
    daysShort: {
      monday: t("daysShort.monday"),
      tuesday: t("daysShort.tuesday"),
      wednesday: t("daysShort.wednesday"),
      thursday: t("daysShort.thursday"),
      friday: t("daysShort.friday"),
      saturday: t("daysShort.saturday"),
      sunday: t("daysShort.sunday"),
    },
    months: {
      january: t("months.january"),
      february: t("months.february"),
      march: t("months.march"),
      april: t("months.april"),
      may: t("months.may"),
      june: t("months.june"),
      july: t("months.july"),
      august: t("months.august"),
      september: t("months.september"),
      october: t("months.october"),
      november: t("months.november"),
      december: t("months.december"),
    },
    blockedDatesList: {
      title: t("blockedDatesList.title"),
      empty: t("blockedDatesList.empty"),
      allDay: t("blockedDatesList.allDay"),
      specificTimes: t("blockedDatesList.specificTimes"),
      noReason: t("blockedDatesList.noReason"),
      delete: t("blockedDatesList.delete"),
      confirmDelete: t("blockedDatesList.confirmDelete"),
    },
    fillRate: {
      low: t("fillRate.low"),
      medium: t("fillRate.medium"),
      high: t("fillRate.high"),
    },
    responsive: {
      showCalendar: t("responsive.showCalendar"),
      showList: t("responsive.showList"),
    },
    manualBookingForm: {
      title: t("manualBookingForm.title"),
      serviceLabel: t("manualBookingForm.serviceLabel"),
      selectService: t("manualBookingForm.selectService"),
      dateLabel: t("manualBookingForm.dateLabel"),
      timeLabel: t("manualBookingForm.timeLabel"),
      participantsLabel: t("manualBookingForm.participantsLabel"),
      firstName: t("manualBookingForm.firstName"),
      lastName: t("manualBookingForm.lastName"),
      email: t("manualBookingForm.email"),
      phone: t("manualBookingForm.phone"),
      optional: t("manualBookingForm.optional"),
      submit: t("manualBookingForm.submit"),
      submitting: t("manualBookingForm.submitting"),
      success: t("manualBookingForm.success"),
      error: t("manualBookingForm.error"),
      back: t("manualBookingForm.back"),
    },
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/dashboard/center"
              className="mb-2 inline-flex items-center gap-1 text-sm text-white/60 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("backToDashboard")}
            </Link>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">{t("title")}</h1>
            <p className="mt-1 text-sm text-white/60 sm:text-base">{t("subtitle")}</p>
          </div>
        </div>

        {/* Calendar View */}
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <CalendarView
              bookings={bookingsData}
              blockedDates={blockedDatesData}
              services={servicesData}
              centers={centersData}
              selectedCenterId={selectedCenterId}
              currentYear={currentYear}
              currentMonth={currentMonth}
              locale={locale}
              translations={translations}
            />
          </div>

          {/* Sidebar - Blocked Dates */}
          <div className="lg:col-span-1">
            <BlockedDatesList
              blockedDates={blockedDatesData}
              centerId={selectedCenterId}
              locale={locale}
              translations={translations.blockedDatesList}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
