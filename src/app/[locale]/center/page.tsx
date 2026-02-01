import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CenterStatsCards } from "@/components/center/CenterStatsCards";
import { PendingBookingsWidget } from "@/components/center/PendingBookingsWidget";
import { WeekCalendarPreview } from "@/components/center/WeekCalendarPreview";
import { RecentReviewsWidget } from "@/components/center/RecentReviewsWidget";
import { CenterQuickActions } from "@/components/center/CenterQuickActions";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import type { Decimal } from "@prisma/client/runtime/library";

type LocalizedJson = Record<string, unknown>;

// Type for pending booking with included relations
interface PendingBookingWithRelations {
  id: string;
  reference: string;
  diveDate: Date;
  diveTime: Date;
  participants: number;
  totalPrice: Decimal;
  currency: string;
  guestFirstName: string | null;
  guestLastName: string | null;
  guestEmail: string;
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
    price: Decimal;
  };
}

// Type for review with included relations
interface ReviewWithUser {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  centerResponse: string | null;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
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

function normalizeDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return normalizeDateOnly(d);
}

function getEndOfWeek(date: Date): Date {
  const startOfWeek = getStartOfWeek(date);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  return normalizeDateOnly(endOfWeek);
}

function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "centerDashboard" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function CenterDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const t = await getTranslations({ locale, namespace: "centerDashboard" });

  // Redirect if not authenticated
  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  // Check if user is CENTER_OWNER or ADMIN
  const userType = session.user.userType;
  if (userType !== "CENTER_OWNER" && userType !== "ADMIN") {
    redirect(`/${locale}/dashboard`);
  }

  // Find the user's center
  const center = await prisma.diveCenter.findFirst({
    where: { ownerId: session.user.id },
    select: {
      id: true,
      slug: true,
      name: true,
      rating: true,
      reviewCount: true,
      status: true,
      verified: true,
    },
  });

  // If no center found, redirect to center creation
  if (!center) {
    redirect(`/${locale}/onboard/center`);
  }

  // If center is not approved, show a pending status message
  if (center.status !== "APPROVED") {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-8 backdrop-blur-xl">
            <h1 className="text-2xl font-bold text-amber-200">
              {t("pendingApproval.title")}
            </h1>
            <p className="mt-4 text-amber-200/80">
              {t("pendingApproval.description")}
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard"
                className="inline-block rounded-xl bg-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/20"
              >
                {t("pendingApproval.backToDashboard")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const today = normalizeDateOnly(new Date());
  const startOfWeek = getStartOfWeek(today);
  const endOfWeek = getEndOfWeek(today);
  const startOfMonth = getStartOfMonth(today);

  // Fetch all stats in parallel
  const [
    todayBookingsCount,
    weekBookingsCount,
    monthRevenueResult,
    pendingBookings,
    weekBookings,
    recentReviews,
  ] = await Promise.all([
    // Today's bookings count
    prisma.booking.count({
      where: {
        centerId: center.id,
        diveDate: today,
        status: { in: ["PENDING", "CONFIRMED", "PAID", "RUNNING"] },
      },
    }),

    // Week's bookings count
    prisma.booking.count({
      where: {
        centerId: center.id,
        diveDate: { gte: startOfWeek, lte: endOfWeek },
        status: { in: ["PENDING", "CONFIRMED", "PAID", "RUNNING"] },
      },
    }),

    // Month's revenue (net after commission)
    prisma.commission.aggregate({
      where: {
        centerId: center.id,
        createdAt: { gte: startOfMonth },
        status: { in: ["PENDING", "PAID"] },
      },
      _sum: { centerAmount: true },
    }),

    // Pending bookings to process
    prisma.booking.findMany({
      where: {
        centerId: center.id,
        status: "PENDING",
      },
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
            price: true,
          },
        },
      },
      orderBy: { diveDate: "asc" },
      take: 5,
    }),

    // Week's bookings for calendar
    prisma.booking.findMany({
      where: {
        centerId: center.id,
        diveDate: { gte: startOfWeek, lte: endOfWeek },
        status: { in: ["CONFIRMED", "PAID", "RUNNING"] },
      },
      select: {
        id: true,
        diveDate: true,
        participants: true,
      },
      orderBy: { diveDate: "asc" },
    }),

    // Recent reviews
    prisma.review.findMany({
      where: {
        centerId: center.id,
        status: "APPROVED",
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  // Calculate month revenue (with proper null checks)
  const sumResult = monthRevenueResult._sum as { centerAmount: Decimal | null } | undefined;
  const monthRevenue = sumResult?.centerAmount
    ? Number(sumResult.centerAmount)
    : 0;
  
  // Cast to proper types (Prisma's include inference can be incomplete)
  const typedPendingBookings = pendingBookings as unknown as PendingBookingWithRelations[];
  const typedRecentReviews = recentReviews as unknown as ReviewWithUser[];

  // Calculate bookings per day for calendar
  const bookingsPerDay = new Map<string, number>();
  for (const booking of weekBookings) {
    const dateKey = booking.diveDate.toISOString().split("T")[0];
    const current = bookingsPerDay.get(dateKey) || 0;
    bookingsPerDay.set(dateKey, current + booking.participants);
  }

  // Create week days array
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    const dateKey = date.toISOString().split("T")[0];
    weekDays.push({
      date,
      dateKey,
      participants: bookingsPerDay.get(dateKey) || 0,
      isToday: dateKey === today.toISOString().split("T")[0],
    });
  }

  const centerName = getLocalizedText(center.name, locale) || "Mon centre";

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">{centerName}</h1>
            <p className="mt-2 text-white/60">{t("subtitle")}</p>
          </div>
          {center.verified && (
            <span className="inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200">
              {t("verified")}
            </span>
          )}
        </div>

        {/* Stats Cards */}
        <div className="mt-8">
          <CenterStatsCards
            todayBookings={todayBookingsCount}
            weekBookings={weekBookingsCount}
            monthRevenue={monthRevenue}
            rating={Number(center.rating)}
            translations={{
              todayBookings: t("stats.todayBookings"),
              weekBookings: t("stats.weekBookings"),
              monthRevenue: t("stats.monthRevenue"),
              rating: t("stats.rating"),
            }}
          />
        </div>

        {/* Main Grid */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Left Column - 2/3 */}
          <div className="space-y-6 lg:col-span-2">
            {/* Pending Bookings */}
            <PendingBookingsWidget
              bookings={typedPendingBookings.map((b) => ({
                id: b.id,
                reference: b.reference,
                diveDate: b.diveDate,
                diveTime: b.diveTime,
                participants: b.participants,
                totalPrice: Number(b.totalPrice),
                currency: b.currency,
                guestFirstName: b.guestFirstName,
                guestLastName: b.guestLastName,
                guestEmail: b.guestEmail,
                user: b.user
                  ? {
                      firstName: b.user.firstName,
                      lastName: b.user.lastName,
                      email: b.user.email,
                      avatarUrl: b.user.avatarUrl,
                    }
                  : null,
                service: {
                  name: getLocalizedText(b.service.name, locale),
                },
              }))}
              locale={locale}
              translations={{
                title: t("pendingBookings.title"),
                emptyTitle: t("pendingBookings.emptyTitle"),
                emptyDescription: t("pendingBookings.emptyDescription"),
                confirm: t("pendingBookings.confirm"),
                reject: t("pendingBookings.reject"),
                participants: t("pendingBookings.participants"),
                viewAll: t("pendingBookings.viewAll"),
              }}
            />

            {/* Week Calendar */}
            <WeekCalendarPreview
              weekDays={weekDays}
              locale={locale}
              translations={{
                title: t("calendar.title"),
                participants: t("calendar.participants"),
                noBookings: t("calendar.noBookings"),
                viewCalendar: t("calendar.viewCalendar"),
              }}
            />
          </div>

          {/* Right Column - 1/3 */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <CenterQuickActions
              translations={{
                title: t("quickActions.title"),
                createOffer: t("quickActions.createOffer"),
                createOfferDesc: t("quickActions.createOfferDesc"),
                viewCalendar: t("quickActions.viewCalendar"),
                viewCalendarDesc: t("quickActions.viewCalendarDesc"),
                manageBookings: t("quickActions.manageBookings"),
                manageBookingsDesc: t("quickActions.manageBookingsDesc"),
                viewStats: t("quickActions.viewStats"),
                viewStatsDesc: t("quickActions.viewStatsDesc"),
                manageTeam: t("quickActions.manageTeam"),
                manageTeamDesc: t("quickActions.manageTeamDesc"),
                editCenter: t("quickActions.editCenter"),
                editCenterDesc: t("quickActions.editCenterDesc"),
              }}
            />

            {/* Recent Reviews */}
            <RecentReviewsWidget
              reviews={typedRecentReviews.map((r) => ({
                id: r.id,
                rating: r.rating,
                comment: r.comment,
                createdAt: r.createdAt,
                centerResponse: r.centerResponse,
                user: {
                  firstName: r.user.firstName,
                  lastName: r.user.lastName,
                  avatarUrl: r.user.avatarUrl,
                },
              }))}
              translations={{
                title: t("reviews.title"),
                emptyTitle: t("reviews.emptyTitle"),
                emptyDescription: t("reviews.emptyDescription"),
                respond: t("reviews.respond"),
                responded: t("reviews.responded"),
                viewAll: t("reviews.viewAll"),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
