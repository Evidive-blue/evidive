import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CenterReviewStats } from "@/components/center/CenterReviewStats";
import { RatingDistribution } from "@/components/center/RatingDistribution";
import { CenterReviewsList } from "@/components/center/CenterReviewsList";
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
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "centerReviews" });

  const center = await prisma.diveCenter.findUnique({
    where: { slug },
    select: { name: true },
  });

  const centerName = center ? getLocalizedText(center.name, locale) : "";

  return {
    title: centerName ? `${t("meta.title")} - ${centerName}` : t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function CenterManageReviewsPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const t = await getTranslations({ locale, namespace: "centerReviews" });

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  const userType = session.user.userType;
  if (userType !== "CENTER_OWNER" && userType !== "ADMIN") {
    redirect(`/${locale}/dashboard`);
  }

  // Get center by slug
  const center = await prisma.diveCenter.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      rating: true,
      reviewCount: true,
      status: true,
      ownerId: true,
    },
  });

  if (!center) {
    notFound();
  }

  // Verify ownership (ADMIN can access any center)
  if (userType !== "ADMIN" && center.ownerId !== session.user.id) {
    redirect(`/${locale}/dashboard`);
  }

  if (center.status !== "APPROVED") {
    redirect(`/${locale}/center/manage/${slug}`);
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
    <div className="pt-8 pb-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">{t("title")}</h1>
          <p className="mt-2 text-white/60">
            {t("subtitle", { centerName })}
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
