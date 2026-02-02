import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, Star, MessageSquare } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Prisma } from "@prisma/client";
import { ReviewsListClient } from "./reviews-list-client";

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
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "reviews.meta" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function ReviewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const t = await getTranslations({ locale, namespace: "reviews" });

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  // Type for review with relations
  type ReviewWithRelations = Prisma.ReviewGetPayload<{
    include: {
      center: { select: { id: true; slug: true; name: true; logoUrl: true } };
      booking: { select: { id: true; reference: true } };
    };
  }>;

  // Fetch user's reviews
  const reviews = await prisma.review.findMany({
    where: { userId: session.user.id },
    include: {
      center: {
        select: {
          id: true,
          slug: true,
          name: true,
          logoUrl: true,
        },
      },
      booking: {
        select: {
          id: true,
          reference: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  }) as ReviewWithRelations[];

  // Type for booking with relations
  type BookingWithRelations = Prisma.BookingGetPayload<{
    include: {
      center: { select: { id: true; slug: true; name: true; logoUrl: true; city: true; country: true } };
      service: { select: { id: true; name: true } };
    };
  }>;

  // Fetch completed bookings without reviews
  const bookingsWithoutReview = await prisma.booking.findMany({
    where: {
      userId: session.user.id,
      status: "COMPLETED",
      review: null,
    },
    include: {
      center: {
        select: {
          id: true,
          slug: true,
          name: true,
          logoUrl: true,
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
  }) as BookingWithRelations[];

  // Transform reviews for client component
  const reviewsData = reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    photos: review.photos,
    status: review.status,
    createdAt: review.createdAt,
    diveDate: review.diveDate,
    center: {
      id: review.center.id,
      slug: review.center.slug,
      name: getLocalizedText(review.center.name, locale),
      logoUrl: review.center.logoUrl,
    },
  }));

  // Transform bookings for client component
  const pendingBookingsData = bookingsWithoutReview.map((booking) => ({
    id: booking.id,
    reference: booking.reference,
    diveDate: booking.diveDate,
    diveTime: booking.diveTime,
    center: {
      id: booking.center.id,
      slug: booking.center.slug,
      name: getLocalizedText(booking.center.name, locale),
      logoUrl: booking.center.logoUrl,
      city: booking.center.city ?? "",
      country: booking.center.country ?? "",
    },
    service: {
      id: booking.service.id,
      name: getLocalizedText(booking.service.name, locale),
    },
  }));

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4 text-white/70 hover:text-white hover:bg-white/10 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("backToDashboard")}
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">{t("title")}</h1>
          <p className="text-white/70">{t("subtitle")}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                  <Star className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{reviews.length}</p>
                  <p className="text-xs text-white/60">{t("myReviews")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
                  <MessageSquare className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{bookingsWithoutReview.length}</p>
                  <p className="text-xs text-white/60">{t("pendingReviews")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Client component for interactivity */}
        <ReviewsListClient
          reviews={reviewsData}
          pendingBookings={pendingBookingsData}
          locale={locale}
        />
      </div>
    </div>
  );
}
