import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Calendar, Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookingCard, BookingFilters } from "@/components/bookings";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";

type FilterValue = "all" | "upcoming" | "past" | "cancelled";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "bookings" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

function normalizeDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export default async function BookingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const { locale } = await params;
  const { filter } = await searchParams;
  setRequestLocale(locale);

  const session = await auth();
  const t = await getTranslations({ locale, namespace: "bookings" });

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  const today = normalizeDateOnly(new Date());
  const currentFilter = (filter as FilterValue) || "all";

  // Build where clause based on filter
  const baseWhere = { userId: session.user.id };
  let whereClause: Prisma.BookingWhereInput;

  switch (currentFilter) {
    case "upcoming":
      whereClause = {
        ...baseWhere,
        diveDate: { gte: today },
        status: { in: ["PENDING", "CONFIRMED", "PAID", "RUNNING"] },
      };
      break;
    case "past":
      whereClause = {
        ...baseWhere,
        status: "COMPLETED",
      };
      break;
    case "cancelled":
      whereClause = {
        ...baseWhere,
        status: "CANCELLED",
      };
      break;
    default:
      whereClause = baseWhere;
  }

  // Fetch bookings
  const bookings = await prisma.booking.findMany({
    where: whereClause,
    include: {
      center: {
        select: {
          id: true,
          name: true,
          city: true,
          country: true,
        },
      },
      service: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { diveDate: "desc" },
  });

  // Fetch counts for filters
  const [allCount, upcomingCount, pastCount, cancelledCount] = await Promise.all([
    prisma.booking.count({ where: { userId: session.user.id } }),
    prisma.booking.count({
      where: {
        userId: session.user.id,
        diveDate: { gte: today },
        status: { in: ["PENDING", "CONFIRMED", "PAID", "RUNNING"] },
      },
    }),
    prisma.booking.count({
      where: {
        userId: session.user.id,
        status: "COMPLETED",
      },
    }),
    prisma.booking.count({
      where: {
        userId: session.user.id,
        status: "CANCELLED",
      },
    }),
  ]);

  const statusLabels = {
    PENDING: t("status.PENDING"),
    CONFIRMED: t("status.CONFIRMED"),
    PAID: t("status.PAID"),
    RUNNING: t("status.RUNNING"),
    COMPLETED: t("status.COMPLETED"),
    CANCELLED: t("status.CANCELLED"),
    NOSHOW: t("status.NOSHOW"),
    REMOVED: t("status.REMOVED"),
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{t("title")}</h1>
              <p className="text-white/70">{t("subtitle")}</p>
            </div>
            <Link href="/explorer">
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500">
                <Search className="mr-2 h-4 w-4" />
                {t("newBooking")}
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <BookingFilters
            currentFilter={currentFilter}
            translations={{
              all: t("filters.all"),
              upcoming: t("filters.upcoming"),
              past: t("filters.past"),
              cancelled: t("filters.cancelled"),
            }}
            counts={{
              all: allCount,
              upcoming: upcomingCount,
              past: pastCount,
              cancelled: cancelledCount,
            }}
          />
        </div>

        {/* Bookings list */}
        {bookings.length === 0 ? (
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                <Calendar className="h-8 w-8 text-white/40" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                {t("empty.title")}
              </h3>
              <p className="mb-6 max-w-sm text-sm text-white/60">
                {currentFilter === "all"
                  ? t("empty.description")
                  : t("empty.filtered")}
              </p>
              {currentFilter === "all" && (
                <Link href="/explorer">
                  <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500">
                    <Search className="mr-2 h-4 w-4" />
                    {t("empty.cta")}
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {bookings.map((booking: any) => (
              <BookingCard
                key={booking.id}
                booking={{
                  id: booking.id,
                  reference: booking.reference,
                  diveDate: booking.diveDate,
                  diveTime: booking.diveTime,
                  participants: booking.participants,
                  totalPrice: booking.totalPrice,
                  currency: booking.currency,
                  status: booking.status,
                  center: {
                    name: booking.center?.name,
                    city: booking.center?.city,
                    country: booking.center?.country,
                  },
                  service: {
                    name: booking.service?.name,
                  },
                }}
                locale={locale}
                translations={{
                  viewDetails: t("viewDetails"),
                  participants: t("participants"),
                  statusLabels,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
