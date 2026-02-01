import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import type { BookingStatus } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";
import { CenterBookingCard } from "@/components/center/bookings/CenterBookingCard";
import { CenterBookingFilters } from "@/components/center/bookings/CenterBookingFilters";
import { ManualBookingForm } from "@/components/center/bookings/ManualBookingForm";
import { ArrowLeft, CalendarX } from "lucide-react";

type LocalizedJson = Record<string, unknown>;

interface SearchParams {
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  serviceId?: string;
  page?: string;
}

interface BookingWithRelations {
  id: string;
  reference: string;
  diveDate: Date;
  diveTime: Date;
  participants: number;
  totalPrice: Decimal;
  currency: string;
  status: BookingStatus;
  source: string;
  guestFirstName: string | null;
  guestLastName: string | null;
  guestEmail: string;
  guestPhone: string | null;
  specialRequests: string | null;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    avatarUrl: string | null;
  } | null;
  service: {
    id: string;
    name: unknown;
  };
  extras: Array<{
    id: string;
    quantity: number;
    totalPrice: Decimal;
    extra: {
      id: string;
      name: unknown;
    };
  }>;
}

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

const ITEMS_PER_PAGE = 20;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "centerBookings" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function CenterBookingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  const filters = await searchParams;
  setRequestLocale(locale);

  const session = await auth();
  const t = await getTranslations({ locale, namespace: "centerBookings" });

  // Redirect if not authenticated
  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  // Check user type
  if (
    session.user.userType !== "CENTER_OWNER" &&
    session.user.userType !== "ADMIN"
  ) {
    redirect(`/${locale}/dashboard`);
  }

  // Get user's center
  const center = await prisma.diveCenter.findFirst({
    where: { ownerId: session.user.id },
    select: { id: true, name: true, status: true },
  });

  if (!center) {
    redirect(`/${locale}/onboard/center`);
  }

  if (center.status !== "APPROVED") {
    redirect(`/${locale}/center`);
  }

  // Build filters
  const statusFilter = filters.status as BookingStatus | "all" | undefined;
  const currentPage = parseInt(filters.page || "1", 10);
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;

  // Build where clause
  const where: Record<string, unknown> = { centerId: center.id };

  if (statusFilter && statusFilter !== "all") {
    where.status = statusFilter;
  }

  if (filters.search) {
    where.OR = [
      { reference: { contains: filters.search, mode: "insensitive" } },
      { guestFirstName: { contains: filters.search, mode: "insensitive" } },
      { guestLastName: { contains: filters.search, mode: "insensitive" } },
      { guestEmail: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.dateFrom || filters.dateTo) {
    where.diveDate = {};
    if (filters.dateFrom) {
      (where.diveDate as Record<string, unknown>).gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      (where.diveDate as Record<string, unknown>).lte = new Date(filters.dateTo);
    }
  }

  if (filters.serviceId) {
    where.serviceId = filters.serviceId;
  }

  // Fetch data in parallel
  const [
    bookings,
    totalCount,
    allCount,
    pendingCount,
    confirmedCount,
    paidCount,
    runningCount,
    completedCount,
    cancelledCount,
    noshowCount,
    services,
  ] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
          },
        },
        extras: {
          include: {
            extra: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { diveDate: "desc" },
      skip,
      take: ITEMS_PER_PAGE,
    }),
    prisma.booking.count({ where }),
    prisma.booking.count({ where: { centerId: center.id } }),
    prisma.booking.count({ where: { centerId: center.id, status: "PENDING" } }),
    prisma.booking.count({ where: { centerId: center.id, status: "CONFIRMED" } }),
    prisma.booking.count({ where: { centerId: center.id, status: "PAID" } }),
    prisma.booking.count({ where: { centerId: center.id, status: "RUNNING" } }),
    prisma.booking.count({ where: { centerId: center.id, status: "COMPLETED" } }),
    prisma.booking.count({ where: { centerId: center.id, status: "CANCELLED" } }),
    prisma.booking.count({ where: { centerId: center.id, status: "NOSHOW" } }),
    prisma.diveService.findMany({
      where: { centerId: center.id, isActive: true },
      select: { id: true, name: true },
    }),
  ]);

  const typedBookings = bookings as unknown as BookingWithRelations[];
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Status counts
  const counts: Record<string, number> = {
    all: allCount,
    PENDING: pendingCount,
    CONFIRMED: confirmedCount,
    PAID: paidCount,
    RUNNING: runningCount,
    COMPLETED: completedCount,
    CANCELLED: cancelledCount,
    NOSHOW: noshowCount,
    REMOVED: 0,
  };

  // Transform services for filter
  const serviceOptions = services.map((s) => ({
    id: s.id,
    name: getLocalizedText(s.name, locale),
  }));

  const centerName = getLocalizedText(center.name, locale) || "Mon centre";

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/center"
              className="mb-2 inline-flex items-center gap-1 text-sm text-white/60 hover:text-white transition"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("backToCenter")}
            </Link>
            <h1 className="text-3xl font-bold text-white">{t("title")}</h1>
            <p className="mt-1 text-white/60">{t("subtitle", { centerName })}</p>
          </div>
          <ManualBookingForm
            locale={locale}
            translations={{
              title: t("manualBooking.title"),
              description: t("manualBooking.description"),
              triggerButton: t("manualBooking.triggerButton"),
              service: t("manualBooking.service"),
              selectService: t("manualBooking.selectService"),
              date: t("manualBooking.date"),
              time: t("manualBooking.time"),
              selectTime: t("manualBooking.selectTime"),
              participants: t("manualBooking.participants"),
              clientInfo: t("manualBooking.clientInfo"),
              firstName: t("manualBooking.firstName"),
              lastName: t("manualBooking.lastName"),
              email: t("manualBooking.email"),
              phone: t("manualBooking.phone"),
              optional: t("manualBooking.optional"),
              specialRequests: t("manualBooking.specialRequests"),
              certification: t("manualBooking.certification"),
              extras: t("manualBooking.extras"),
              noExtras: t("manualBooking.noExtras"),
              totalPrice: t("manualBooking.totalPrice"),
              submit: t("manualBooking.submit"),
              submitting: t("manualBooking.submitting"),
              cancel: t("manualBooking.cancel"),
              success: t("manualBooking.success"),
              successMessage: t("manualBooking.successMessage"),
              error: t("manualBooking.error"),
              noServices: t("manualBooking.noServices"),
              createAnother: t("manualBooking.createAnother"),
              close: t("manualBooking.close"),
            }}
          />
        </div>

        {/* Filters */}
        <div className="mt-8">
          <CenterBookingFilters
            currentStatus={(statusFilter as BookingStatus) || "all"}
            currentSearch={filters.search || ""}
            currentDateFrom={filters.dateFrom}
            currentDateTo={filters.dateTo}
            currentServiceId={filters.serviceId}
            services={serviceOptions}
            counts={counts as Record<BookingStatus | "all", number>}
            translations={{
              search: t("filters.search"),
              searchPlaceholder: t("filters.searchPlaceholder"),
              status: t("filters.status"),
              all: t("filters.all"),
              pending: t("filters.pending"),
              confirmed: t("filters.confirmed"),
              paid: t("filters.paid"),
              completed: t("filters.completed"),
              cancelled: t("filters.cancelled"),
              running: t("filters.running"),
              noshow: t("filters.noshow"),
              dateRange: t("filters.dateRange"),
              from: t("filters.from"),
              to: t("filters.to"),
              service: t("filters.service"),
              allServices: t("filters.allServices"),
              clearFilters: t("filters.clearFilters"),
              exportCsv: t("filters.exportCsv"),
              exporting: t("filters.exporting"),
            }}
          />
        </div>

        {/* Results count */}
        <div className="mt-6 flex items-center justify-between text-sm text-white/60">
          <span>
            {t("results", { count: totalCount })}
          </span>
          {totalPages > 1 && (
            <span>
              {t("page", { current: currentPage, total: totalPages })}
            </span>
          )}
        </div>

        {/* Bookings List */}
        <div className="mt-4 space-y-4">
          {typedBookings.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarX className="mx-auto h-16 w-16 text-white/20" />
              <h3 className="mt-4 text-xl font-semibold text-white/80">
                {t("empty.title")}
              </h3>
              <p className="mt-2 text-white/50">{t("empty.description")}</p>
            </div>
          ) : (
            typedBookings.map((booking) => (
              <CenterBookingCard
                key={booking.id}
                booking={{
                  id: booking.id,
                  reference: booking.reference,
                  diveDate: booking.diveDate,
                  diveTime: booking.diveTime,
                  participants: booking.participants,
                  totalPrice: Number(booking.totalPrice),
                  currency: booking.currency,
                  status: booking.status,
                  source: booking.source,
                  guestFirstName: booking.guestFirstName,
                  guestLastName: booking.guestLastName,
                  guestEmail: booking.guestEmail,
                  guestPhone: booking.guestPhone,
                  specialRequests: booking.specialRequests,
                  user: booking.user,
                  service: {
                    name: getLocalizedText(booking.service.name, locale),
                  },
                  extras: booking.extras.map((e) => ({
                    name: getLocalizedText(e.extra.name, locale),
                    quantity: e.quantity,
                    totalPrice: Number(e.totalPrice),
                  })),
                }}
                locale={locale}
                translations={{
                  viewDetails: t("card.viewDetails"),
                  confirm: t("card.confirm"),
                  cancel: t("card.cancel"),
                  markCompleted: t("card.markCompleted"),
                  markNoShow: t("card.markNoShow"),
                  contactClient: t("card.contactClient"),
                  participants: t("card.participants"),
                  extras: t("card.extras"),
                  source: t("card.source"),
                  specialRequests: t("card.specialRequests"),
                  statusLabels: {
                    PENDING: t("status.PENDING"),
                    CONFIRMED: t("status.CONFIRMED"),
                    PAID: t("status.PAID"),
                    RUNNING: t("status.RUNNING"),
                    COMPLETED: t("status.COMPLETED"),
                    CANCELLED: t("status.CANCELLED"),
                    NOSHOW: t("status.NOSHOW"),
                    REMOVED: t("status.REMOVED"),
                  },
                  sources: {
                    website: t("sources.website"),
                    manual: t("sources.manual"),
                    api: t("sources.api"),
                  },
                  actions: t("card.actions"),
                  confirmSuccess: t("card.confirmSuccess"),
                  cancelSuccess: t("card.cancelSuccess"),
                  completeSuccess: t("card.completeSuccess"),
                  error: t("card.error"),
                  cancelModal: {
                    title: t("cancelModal.title"),
                    description: t("cancelModal.description"),
                    reasonLabel: t("cancelModal.reasonLabel"),
                    reasonPlaceholder: t("cancelModal.reasonPlaceholder"),
                    reasonRequired: t("cancelModal.reasonRequired"),
                    cancelButton: t("cancelModal.cancel"),
                    confirmButton: t("cancelModal.confirm"),
                    confirming: t("cancelModal.confirming"),
                    warning: t("cancelModal.warning"),
                    success: t("cancelModal.success"),
                    error: t("cancelModal.error"),
                  },
                }}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {currentPage > 1 && (
              <Link
                href={`/center/bookings?${new URLSearchParams({
                  ...filters,
                  page: String(currentPage - 1),
                }).toString()}`}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition"
              >
                {t("pagination.previous")}
              </Link>
            )}

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Link
                    key={pageNum}
                    href={`/center/bookings?${new URLSearchParams({
                      ...filters,
                      page: String(pageNum),
                    }).toString()}`}
                    className={`rounded-lg px-3 py-2 text-sm transition ${
                      pageNum === currentPage
                        ? "bg-cyan-500 text-white"
                        : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                    }`}
                  >
                    {pageNum}
                  </Link>
                );
              })}
            </div>

            {currentPage < totalPages && (
              <Link
                href={`/center/bookings?${new URLSearchParams({
                  ...filters,
                  page: String(currentPage + 1),
                }).toString()}`}
                className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 transition"
              >
                {t("pagination.next")}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
