import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CenterReviewStats } from "@/components/center/CenterReviewStats";
import { RatingDistribution } from "@/components/center/RatingDistribution";
import { CenterReviewsList } from "@/components/center/CenterReviewsList";
import { Link } from "@/i18n/navigation";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "centerReviews" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function CenterReviewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const t = await getTranslations({ locale, namespace: "centerReviews" });

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
                href="/center"
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

  // Fetch reviews with user and booking info
  const reviews = await prisma.review.findMany({
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
      booking: {
        include: {
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate rating distribution
  const ratingDistribution: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  for (const review of reviews) {
    ratingDistribution[review.rating] = (ratingDistribution[review.rating] || 0) + 1;
  }

  const centerName = getLocalizedText(center.name, locale) || "Mon centre";
  const averageRating = Number(center.rating) || 0;
  const totalReviews = center.reviewCount || reviews.length;

  // Transform reviews for the component
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformedReviews = reviews.map((review: any) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    photos: review.photos,
    createdAt: review.createdAt,
    centerResponse: review.centerResponse,
    centerResponseAt: review.centerResponseAt,
    user: {
      firstName: review.user.firstName,
      lastName: review.user.lastName,
      avatarUrl: review.user.avatarUrl,
    },
    serviceName: review.booking?.service
      ? getLocalizedText(review.booking.service.name, locale)
      : null,
  }));

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/center"
          className="mb-6 inline-flex items-center gap-1 text-sm text-white/60 transition hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          {t("backToDashboard")}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">{t("title")}</h1>
          <p className="mt-2 text-white/60">
            {t("subtitle").replace("{centerName}", centerName)}
          </p>
        </div>

        {/* Stats Section */}
        <div className="mb-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CenterReviewStats
              averageRating={averageRating}
              totalReviews={totalReviews}
              translations={{
                averageRating: t("stats.averageRating"),
                totalReviews: t("stats.totalReviews"),
                outOf5: t("stats.outOf5"),
                reviews: t("stats.reviews"),
              }}
            />
          </div>
          <RatingDistribution
            distribution={ratingDistribution}
            totalCount={totalReviews}
            translations={{
              title: t("distribution.title"),
              stars: t("distribution.stars"),
            }}
          />
        </div>

        {/* Reviews List */}
        <div className="mt-8">
          <h2 className="mb-6 text-xl font-semibold text-white">
            {t("listTitle")}
          </h2>
          <CenterReviewsList
            reviews={transformedReviews}
            locale={locale}
            translations={{
              sortBy: t("filters.sortBy"),
              sortNewest: t("filters.sortNewest"),
              sortOldest: t("filters.sortOldest"),
              sortHighest: t("filters.sortHighest"),
              sortLowest: t("filters.sortLowest"),
              filterByRating: t("filters.filterByRating"),
              allRatings: t("filters.allRatings"),
              starsFilter: t("filters.starsFilter"),
              clearFilters: t("filters.clearFilters"),
              noReviews: t("empty.title"),
              noReviewsFiltered: t("empty.filtered"),
              showingResults: t("showingResults"),
              card: {
                respond: t("card.respond"),
                responded: t("card.responded"),
                service: t("card.service"),
                yourResponse: t("card.yourResponse"),
                respondedOn: t("card.respondedOn"),
                showPhotos: t("card.showPhotos"),
                hidePhotos: t("card.hidePhotos"),
              },
              modal: {
                title: t("modal.title"),
                description: t("modal.description"),
                responseLabel: t("modal.responseLabel"),
                responsePlaceholder: t("modal.responsePlaceholder"),
                cancel: t("modal.cancel"),
                submit: t("modal.submit"),
                submitting: t("modal.submitting"),
                success: t("modal.success"),
                error: t("modal.error"),
                minLength: t("modal.minLength"),
                maxLength: t("modal.maxLength"),
                alreadyResponded: t("modal.alreadyResponded"),
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
