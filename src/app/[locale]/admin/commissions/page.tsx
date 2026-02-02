import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import type { CommissionStatus, Prisma } from "@prisma/client";

type LocalizedJson = Record<string, unknown>;

type StatusCount = {
  status: CommissionStatus;
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
  const t = await getTranslations({ locale, namespace: "adminCommissions" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function AdminCommissionsPage({
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
  const t = await getTranslations({ locale, namespace: "adminCommissions" });

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  if (session.user.userType !== "ADMIN") {
    redirect(`/${locale}/dashboard`);
  }

  const currentPage = Math.max(1, parseInt(page || "1", 10));
  const pageSize = 20;
  const skip = (currentPage - 1) * pageSize;

  // Calculate date ranges
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Build where clause
  const whereClause: Prisma.CommissionWhereInput = {};
  if (status && status !== "ALL") {
    whereClause.status = status as CommissionStatus;
  }

  // Type for commission with relations
  type CommissionWithRelations = Prisma.CommissionGetPayload<{
    include: {
      booking: { select: { id: true; reference: true; totalPrice: true; currency: true } };
      center: { select: { id: true; slug: true; name: true } };
    };
  }>;

  // Fetch commissions with pagination
  const commissions = await prisma.commission.findMany({
    where: whereClause,
    include: {
      booking: {
        select: {
          id: true,
          reference: true,
          totalPrice: true,
          currency: true,
        },
      },
      center: {
        select: {
          id: true,
          slug: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: pageSize,
  }) as CommissionWithRelations[];

  // Fetch stats in parallel
  const [
    totalCount,
    statusCounts,
    totalPlatformRevenue,
    monthPlatformRevenue,
    pendingPayouts,
    paidToCenter,
  ] = await Promise.all([
    prisma.commission.count({ where: whereClause }),
    // Get counts by status
    prisma.commission.groupBy({
      by: ["status"],
      _count: { id: true },
    }) as unknown as Promise<StatusCount[]>,
    // Total platform revenue (paid commissions)
    prisma.commission.aggregate({
      where: { status: "PAID" },
      _sum: { commissionAmount: true },
    }),
    // This month's platform revenue
    prisma.commission.aggregate({
      where: { status: "PAID", createdAt: { gte: startOfMonth } },
      _sum: { commissionAmount: true },
    }),
    // Pending payouts to centers
    prisma.commission.aggregate({
      where: { status: "PENDING" },
      _sum: { centerAmount: true },
    }),
    // Total paid to centers
    prisma.commission.aggregate({
      where: { status: "PAID" },
      _sum: { centerAmount: true },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Build status counts map
  const statusCountMap: Record<string, number> = {};
  for (const sc of statusCounts) {
    statusCountMap[sc.status] = sc._count.id;
  }

  const statuses = ["ALL", "PENDING", "PAID", "CANCELLED"];

  // Format currency
  const totalRevenue = Number(totalPlatformRevenue._sum?.commissionAmount || 0);
  const monthRevenue = Number(monthPlatformRevenue._sum?.commissionAmount || 0);
  const pendingAmount = Number(pendingPayouts._sum?.centerAmount || 0);
  const paidAmount = Number(paidToCenter._sum?.centerAmount || 0);

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

        {/* Stats Cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="text-sm text-white/60">{t("stats.totalRevenue")}</div>
            <div className="mt-2 text-2xl font-bold text-white">{totalRevenue.toFixed(2)}€</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="text-sm text-white/60">{t("stats.thisMonth")}</div>
            <div className="mt-2 text-2xl font-bold text-emerald-400">+{monthRevenue.toFixed(2)}€</div>
          </div>
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 backdrop-blur-xl">
            <div className="text-sm text-amber-200/80">{t("stats.pendingPayouts")}</div>
            <div className="mt-2 text-2xl font-bold text-amber-200">{pendingAmount.toFixed(2)}€</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="text-sm text-white/60">{t("stats.paidOut")}</div>
            <div className="mt-2 text-2xl font-bold text-white">{paidAmount.toFixed(2)}€</div>
          </div>
        </div>

        {/* Status Filters */}
        <div className="mt-8 flex flex-wrap gap-2">
          {statuses.map((s) => {
            const count = s === "ALL" ? totalCount : (statusCountMap[s] || 0);
            const isActive = (status || "ALL") === s;
            return (
              <Link
                key={s}
                href={s === "ALL" ? "/admin/commissions" : `/admin/commissions?status=${s}`}
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

        {/* Commissions List */}
        <div className="mt-4 space-y-3">
          {commissions.map((commission) => {
            const centerName = getLocalizedText(commission.center.name, locale) || commission.center.slug;

            return (
              <div
                key={commission.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-white">
                        {commission.booking.reference}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        commission.status === "PAID"
                          ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                          : commission.status === "PENDING"
                          ? "border border-amber-500/20 bg-amber-500/10 text-amber-200"
                          : "border border-red-500/20 bg-red-500/10 text-red-200"
                      }`}>
                        {t(`status.${commission.status}`)}
                      </span>
                    </div>
                    <div className="mt-2 grid gap-1 text-sm text-white/70">
                      <div>
                        <span className="text-white/50">{t("center")}:</span>{" "}
                        <Link href={`/center/${commission.center.slug}`} className="text-cyan-400 hover:underline">
                          {centerName}
                        </Link>
                      </div>
                      <div>
                        <span className="text-white/50">{t("amount")}:</span>{" "}
                        {Number(commission.booking.totalPrice).toFixed(2)} {commission.booking.currency}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="grid gap-1 text-sm">
                      <div>
                        <span className="text-white/50">{t("platformFee")}:</span>{" "}
                        <span className="font-semibold text-emerald-400">
                          +{Number(commission.commissionAmount).toFixed(2)}€
                        </span>
                      </div>
                      <div>
                        <span className="text-white/50">{t("centerAmount")}:</span>{" "}
                        <span className="font-semibold text-white">
                          {Number(commission.centerAmount).toFixed(2)}€
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-white/40">
                      {new Date(commission.createdAt).toLocaleDateString(locale)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {commissions.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
              {t("noCommissions")}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {currentPage > 1 && (
              <Link
                href={`/admin/commissions?${status ? `status=${status}&` : ""}page=${currentPage - 1}`}
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
                href={`/admin/commissions?${status ? `status=${status}&` : ""}page=${currentPage + 1}`}
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
