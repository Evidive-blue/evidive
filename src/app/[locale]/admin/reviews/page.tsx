import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import type { ReviewStatus, Prisma } from "@prisma/client";
import { approveReview, rejectReview } from "./actions";

type LocalizedJson = Record<string, unknown>;

type StatusCount = {
  status: ReviewStatus;
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
  const t = await getTranslations({ locale, namespace: "adminReviews" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function AdminReviewsPage({
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
  const t = await getTranslations({ locale, namespace: "adminReviews" });

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
  const whereClause: Prisma.ReviewWhereInput = {};
  if (status && status !== "ALL") {
    whereClause.status = status as ReviewStatus;
  }

  // Type for review with relations
  type ReviewWithRelations = Prisma.ReviewGetPayload<{
    include: {
      user: { select: { id: true; firstName: true; lastName: true; email: true; avatarUrl: true } };
      center: { select: { id: true; slug: true; name: true } };
    };
  }>;

  // Fetch reviews with pagination
  const reviews = await prisma.review.findMany({
    where: whereClause,
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
  }) as ReviewWithRelations[];

  const [totalCount, statusCounts] = await Promise.all([
    prisma.review.count({ where: whereClause }),
    // Get counts by status
    prisma.review.groupBy({
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

  const statuses = ["ALL", "PENDING", "APPROVED", "REJECTED"];

  // Generate stars
  function renderStars(rating: number) {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? "text-yellow-400" : "text-white/20"}>
        ★
      </span>
    ));
  }

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
                href={s === "ALL" ? "/admin/reviews" : `/admin/reviews?status=${s}`}
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

        {/* Reviews List */}
        <div className="mt-4 space-y-4">
          {reviews.map((review) => {
            const centerName = getLocalizedText(review.center.name, locale) || review.center.slug;
            const userName = `${review.user.firstName || ""} ${review.user.lastName || ""}`.trim() || review.user.email;

            return (
              <div
                key={review.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div className="flex text-lg">{renderStars(review.rating)}</div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        review.status === "APPROVED"
                          ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                          : review.status === "PENDING"
                          ? "border border-amber-500/20 bg-amber-500/10 text-amber-200"
                          : "border border-red-500/20 bg-red-500/10 text-red-200"
                      }`}>
                        {t(`status.${review.status}`)}
                      </span>
                    </div>

                    {/* User & Center */}
                    <div className="mt-3 grid gap-1 text-sm text-white/70">
                      <div>
                        <span className="text-white/50">{t("user")}:</span> {userName}
                      </div>
                      <div>
                        <span className="text-white/50">{t("center")}:</span>{" "}
                        <Link href={`/center/${review.center.slug}`} className="text-cyan-400 hover:underline">
                          {centerName}
                        </Link>
                      </div>
                    </div>

                    {/* Comment */}
                    {review.comment && (
                      <div className="mt-4 rounded-xl border border-white/5 bg-white/5 p-3">
                        <p className="text-sm text-white/80 whitespace-pre-wrap">{review.comment}</p>
                      </div>
                    )}

                    {/* Date */}
                    <div className="mt-3 text-xs text-white/40">
                      {new Date(review.createdAt).toLocaleDateString(locale, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  {review.status === "PENDING" && (
                    <div className="flex items-center gap-2">
                      <form action={approveReview}>
                        <input type="hidden" name="reviewId" value={review.id} />
                        <input type="hidden" name="locale" value={locale} />
                        <button
                          type="submit"
                          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400"
                        >
                          {t("approve")}
                        </button>
                      </form>
                      <form action={rejectReview}>
                        <input type="hidden" name="reviewId" value={review.id} />
                        <input type="hidden" name="locale" value={locale} />
                        <button
                          type="submit"
                          className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
                        >
                          {t("reject")}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {reviews.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
              {t("noReviews")}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {currentPage > 1 && (
              <Link
                href={`/admin/reviews?${status ? `status=${status}&` : ""}page=${currentPage - 1}`}
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
                href={`/admin/reviews?${status ? `status=${status}&` : ""}page=${currentPage + 1}`}
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
