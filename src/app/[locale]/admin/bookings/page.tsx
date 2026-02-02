import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import type { BookingStatus, Prisma } from "@prisma/client";

type LocalizedJson = Record<string, unknown>;

type StatusCount = {
  status: BookingStatus;
  _count: { id: number };
};

function getLocalizedText(value: unknown, locale: string): string {
  if (!value || typeof value !== "object") return "";
  const obj = value as LocalizedJson;
  const direct = obj[locale];
  if (typeof direct === "string" && direct.trim().length > 0) return direct;
  const fallback = obj.en;
  if (typeof fallback === "string" && fallback.trim().length > 0) return fallback;
  for (const key of Object.keys(obj)) {
    const v = obj[key];
    if (typeof v === "string" && v.trim().length > 0) return v;
  }
  return "";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminBookings" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function AdminBookingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { locale } = await params;
  const { status, page } = await searchParams;
  setRequestLocale(locale);

  const session = await auth();
  const t = await getTranslations({ locale, namespace: "adminBookings" });

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  if (session.user.userType !== "ADMIN") {
    redirect(`/${locale}/dashboard`);
  }

  const currentPage = Math.max(1, parseInt(page || "1", 10));
  const pageSize = 20;
  const skip = (currentPage - 1) * pageSize;

  // Build where clause
  const whereClause: Prisma.BookingWhereInput = {};
  if (status && status !== "ALL") {
    whereClause.status = status as BookingStatus;
  }

  // Type for booking with relations
  type BookingWithRelations = Prisma.BookingGetPayload<{
    include: {
      user: { select: { id: true; firstName: true; lastName: true; email: true } };
      center: { select: { id: true; slug: true; name: true } };
      service: { select: { id: true; name: true } };
    };
  }>;

  // Fetch bookings with pagination
  const bookings = await prisma.booking.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      center: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
      service: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: pageSize,
  }) as BookingWithRelations[];

  const [totalCount, statusCounts] = await Promise.all([
    prisma.booking.count({ where: whereClause }),
    // Get counts by status
    prisma.booking.groupBy({
      by: ["status"],
      _count: { id: true },
    }) as unknown as Promise<StatusCount[]>,
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Build status counts map
  const statusCountMap: Record<string, number> = {};
  for (const sc of statusCounts) {
    statusCountMap[sc.status] = sc._count.id;
  }

  const statuses = ["ALL", "PENDING", "CONFIRMED", "PAID", "RUNNING", "COMPLETED", "CANCELLED", "NOSHOW"];

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">{t("title")}</h1>
            <p className="mt-2 text-white/60">{t("subtitle")}</p>
          </div>
          <Link
            href="/admin"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-xl transition hover:bg-white/10"
          >
            {t("backToAdmin")}
          </Link>
        </div>

        {/* Status Filters */}
        <div className="mt-8 flex flex-wrap gap-2">
          {statuses.map((s) => {
            const count = s === "ALL" ? totalCount : (statusCountMap[s] || 0);
            const isActive = (status || "ALL") === s;
            return (
              <Link
                key={s}
                href={s === "ALL" ? "/admin/bookings" : `/admin/bookings?status=${s}`}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-cyan-500 text-slate-900"
                    : "border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                }`}
              >
                {t(`status.${s}`)} ({count})
              </Link>
            );
          })}
        </div>

        {/* Results count */}
        <div className="mt-6 text-sm text-white/60">
          {t("results", { count: totalCount })}
        </div>

        {/* Bookings List */}
        <div className="mt-4 space-y-3">
          {bookings.map((booking) => {
            const centerName = getLocalizedText(booking.center.name, locale) || booking.center.slug;
            const serviceName = getLocalizedText(booking.service.name, locale);
            const clientName = booking.user
              ? `${booking.user.firstName || ""} ${booking.user.lastName || ""}`.trim() || booking.user.email
              : `${booking.guestFirstName || ""} ${booking.guestLastName || ""}`.trim() || booking.guestEmail;

            return (
              <div
                key={booking.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-white">{booking.reference}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        booking.status === "CONFIRMED" || booking.status === "PAID"
                          ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                          : booking.status === "PENDING"
                          ? "border border-amber-500/20 bg-amber-500/10 text-amber-200"
                          : booking.status === "CANCELLED" || booking.status === "NOSHOW"
                          ? "border border-red-500/20 bg-red-500/10 text-red-200"
                          : "border border-white/10 bg-white/5 text-white/70"
                      }`}>
                        {t(`status.${booking.status}`)}
                      </span>
                    </div>
                    <div className="mt-2 grid gap-1 text-sm text-white/70">
                      <div>
                        <span className="text-white/50">{t("client")}:</span> {clientName}
                      </div>
                      <div>
                        <span className="text-white/50">{t("center")}:</span>{" "}
                        <Link href={`/center/${booking.center.slug}`} className="text-cyan-400 hover:underline">
                          {centerName}
                        </Link>
                      </div>
                      <div>
                        <span className="text-white/50">{t("service")}:</span> {serviceName}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-white">
                      {Number(booking.totalPrice).toFixed(2)} {booking.currency}
                    </div>
                    <div className="mt-1 text-sm text-white/50">
                      {new Date(booking.diveDate).toLocaleDateString(locale)}
                    </div>
                    <div className="text-xs text-white/40">
                      {booking.participants} {t("participants")}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {bookings.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
              {t("noBookings")}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {currentPage > 1 && (
              <Link
                href={`/admin/bookings?${status ? `status=${status}&` : ""}page=${currentPage - 1}`}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10"
              >
                {t("previous")}
              </Link>
            )}
            <span className="px-4 py-2 text-sm text-white/60">
              {t("pageInfo", { current: currentPage, total: totalPages })}
            </span>
            {currentPage < totalPages && (
              <Link
                href={`/admin/bookings?${status ? `status=${status}&` : ""}page=${currentPage + 1}`}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10"
              >
                {t("next")}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
