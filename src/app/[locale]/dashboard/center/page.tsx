import { Link } from "@/i18n/navigation";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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

type GroupByCenterCountRow = {
  readonly centerId: string;
  readonly _count: { readonly _all: number };
};

function isGroupByCenterCountRow(value: unknown): value is GroupByCenterCountRow {
  if (typeof value !== "object" || value === null) return false;
  if (!("centerId" in value) || !("_count" in value)) return false;

  const centerId = (value as { centerId: unknown }).centerId;
  const countObj = (value as { _count: unknown })._count;
  if (typeof centerId !== "string") return false;
  if (typeof countObj !== "object" || countObj === null) return false;
  const all = (countObj as { _all?: unknown })._all;
  return typeof all === "number";
}

function parseGroupByCenterCountRows(value: unknown): readonly GroupByCenterCountRow[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isGroupByCenterCountRow);
}

function statusBadge(status: string): string {
  switch (status) {
    case "APPROVED":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
    case "PENDING":
      return "border-amber-500/20 bg-amber-500/10 text-amber-200";
    case "REJECTED":
      return "border-red-500/20 bg-red-500/10 text-red-200";
    case "SUSPENDED":
      return "border-purple-500/20 bg-purple-500/10 text-purple-200";
    default:
      return "border-white/10 bg-white/5 text-white/70";
  }
}

function normalizeDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export default async function CenterDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();
  const t = await getTranslations({ locale, namespace: "dashboard.center" });

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  const userType = session.user.userType;
  if (userType !== "CENTER_OWNER" && userType !== "ADMIN") {
    redirect(`/${locale}/dashboard`);
  }

  // CENTER_OWNER sees only their centers. ADMIN sees pending centers list shortcut.
  const centers =
    userType === "CENTER_OWNER"
      ? await prisma.diveCenter.findMany({
          where: { ownerId: session.user.id },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            slug: true,
            name: true,
            city: true,
            country: true,
            status: true,
            verified: true,
            stripeAccountId: true,
            createdAt: true,
          },
          take: 50,
        })
      : await prisma.diveCenter.findMany({
          where: { status: "PENDING" },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            slug: true,
            name: true,
            city: true,
            country: true,
            status: true,
            verified: true,
            stripeAccountId: true,
            createdAt: true,
          },
          take: 50,
        });

  const today = normalizeDateOnly(new Date());
  const centerIds = centers.map((c) => c.id);

  const servicesByCenterRaw: unknown =
    centerIds.length > 0
      ? await prisma.diveService.groupBy({
          by: ["centerId"],
          where: { centerId: { in: centerIds } },
          _count: { _all: true },
        })
      : [];

  const bookingsByCenterRaw: unknown =
    centerIds.length > 0
      ? await prisma.booking.groupBy({
          by: ["centerId"],
          where: { centerId: { in: centerIds } },
          _count: { _all: true },
        })
      : [];

  const reviewsByCenterRaw: unknown =
    centerIds.length > 0
      ? await prisma.review.groupBy({
          by: ["centerId"],
          where: { centerId: { in: centerIds } },
          _count: { _all: true },
        })
      : [];

  const servicesByCenter = parseGroupByCenterCountRows(servicesByCenterRaw);
  const bookingsByCenter = parseGroupByCenterCountRows(bookingsByCenterRaw);
  const reviewsByCenter = parseGroupByCenterCountRows(reviewsByCenterRaw);

  const servicesCountByCenterId = new Map(
    servicesByCenter.map((row) => [row.centerId, row._count._all])
  );
  const bookingsCountByCenterId = new Map(
    bookingsByCenter.map((row) => [row.centerId, row._count._all])
  );
  const reviewsCountByCenterId = new Map(
    reviewsByCenter.map((row) => [row.centerId, row._count._all])
  );

  const [
    upcomingBookingsCount,
    pendingBookingsCount,
    unpaidBookingsCount,
    pendingCentersCount,
  ] = await Promise.all([
    centerIds.length > 0
      ? prisma.booking.count({
          where: {
            centerId: { in: centerIds },
            diveDate: { gte: today },
            status: { in: ["PENDING", "CONFIRMED", "PAID", "RUNNING"] },
          },
        })
      : 0,
    centerIds.length > 0
      ? prisma.booking.count({
          where: {
            centerId: { in: centerIds },
            status: "PENDING",
          },
        })
      : 0,
    centerIds.length > 0
      ? prisma.booking.count({
          where: {
            centerId: { in: centerIds },
            paymentStatus: "UNPAID",
            status: { in: ["PENDING", "CONFIRMED"] },
          },
        })
      : 0,
    userType === "ADMIN"
      ? prisma.diveCenter.count({ where: { status: "PENDING" } })
      : 0,
  ]);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">
{userType === "ADMIN" ? t("titleAdmin") : t("title")}
            </h1>
            <p className="mt-2 text-white/60">
              {userType === "ADMIN" ? t("subtitleAdmin") : t("subtitle")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {userType === "CENTER_OWNER" ? (
              <Link
                href="/onboard/center"
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-xl transition hover:bg-white/10"
              >
                {t("createCenter")}
              </Link>
            ) : null}

            {userType === "ADMIN" ? (
              <>
                <Link
                  href="/admin/centers"
                  className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400"
                >
                  {t("validateRequests")}
                </Link>
                <Link
                  href="/admin/users"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-xl transition hover:bg-white/10"
                >
                  {t("manageUsers")}
                </Link>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-white/80 backdrop-blur-xl">
            <div className="text-sm text-white/60">{t("kpis.centers")}</div>
            <div className="mt-1 text-2xl font-semibold text-white">{centers.length}</div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-white/80 backdrop-blur-xl">
            <div className="text-sm text-white/60">{t("kpis.upcomingBookings")}</div>
            <div className="mt-1 text-2xl font-semibold text-white">{upcomingBookingsCount}</div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-white/80 backdrop-blur-xl">
            <div className="text-sm text-white/60">{t("kpis.pendingBookings")}</div>
            <div className="mt-1 text-2xl font-semibold text-white">{pendingBookingsCount}</div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-white/80 backdrop-blur-xl">
            <div className="text-sm text-white/60">
              {userType === "ADMIN" ? t("kpis.pendingCenters") : t("kpis.unpaidBookings")}
            </div>
            <div className="mt-1 text-2xl font-semibold text-white">
              {userType === "ADMIN" ? pendingCentersCount : unpaidBookingsCount}
            </div>
          </div>
        </div>

        {centers.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8 text-white/70 backdrop-blur-xl">
            {userType === "CENTER_OWNER" ? (
              <>
                <div className="text-xl font-semibold text-white">{t("noCenters")}</div>
                <div className="mt-2 text-sm text-white/60">
                  {t("noCentersDesc")}
                </div>
                <div className="mt-6">
                  <Link
                    href="/onboard/center"
                    className="inline-block rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 font-semibold text-white"
                  >
                    {t("createNewCenter")}
                  </Link>
                </div>
              </>
            ) : (
              <div>{t("pendingRequests")}</div>
            )}
          </div>
        ) : (
          <div className="mt-10 space-y-4">
            {centers.map((center) => {
              const name = getLocalizedText(center.name, locale) || center.slug;
              const location = [center.city, center.country].filter(Boolean).join(", ");
              const hasStripe = Boolean(center.stripeAccountId);
              const servicesCount = servicesCountByCenterId.get(center.id) ?? 0;
              const bookingsCount = bookingsCountByCenterId.get(center.id) ?? 0;
              const reviewsCount = reviewsCountByCenterId.get(center.id) ?? 0;
              return (
                <div
                  key={center.id}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-xl font-semibold text-white">{name}</div>
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusBadge(center.status)}`}
                        >
                          {t(`statuses.${center.status}`)}
                        </span>
                        {center.verified ? (
                          <span className="inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-200">
                            {t("statusVerified")}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-sm text-white/60">{location}</div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">
                          {t("labels.services")}: {servicesCount}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">
                          {t("labels.bookings")}: {bookingsCount}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70">
                          {t("labels.reviews")}: {reviewsCount}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 ${
                            hasStripe
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                              : "border-amber-500/20 bg-amber-500/10 text-amber-200"
                          }`}
                        >
                          {hasStripe ? t("labels.stripeConnected") : t("labels.stripeMissing")}
                        </span>
                      </div>
                      {center.status === "PENDING" ? (
                        <div className="mt-3 text-sm text-amber-200/80">
                          {t("pendingDesc")}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={center.status === "APPROVED" ? `/center/${center.slug}` : "/centers"}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10"
                      >
                        {center.status === "APPROVED" ? t("viewPublicCenter") : t("viewCenters")}
                      </Link>
                      {/* TODO: add edit center page later */}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

