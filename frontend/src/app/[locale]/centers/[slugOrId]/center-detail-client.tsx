"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations, useFormatter } from "next-intl";
import { motion } from "framer-motion";
import {
  publicApi,
  reviewApi,
  isAuthenticated,
  type PublicCenter,
  type PublicService,
  type ReviewResponse,
  type CreateReviewRequest,
} from "@/lib/api";
import { Star } from "lucide-react";

type Props = {
  slugOrId: string;
  isUuid: boolean;
  notFoundLabel: string;
};

export function CenterDetailClient({
  slugOrId,
  isUuid,
  notFoundLabel,
}: Props) {
  const t = useTranslations("centersPage");
  const tReviews = useTranslations("reviews");
  const format = useFormatter();
  const [center, setCenter] = useState<PublicCenter | null>(null);
  const [services, setServices] = useState<PublicService[]>([]);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCenter = isUuid
      ? publicApi.getCenterById(slugOrId)
      : publicApi.getCenterBySlug(slugOrId);

    fetchCenter
      .then((c) => {
        setCenter(c);
        return Promise.all([
          publicApi.getServices(c.id),
          reviewApi.getCenterReviews(c.id),
        ]);
      })
      .then(([svc, rev]) => {
        setServices(svc);
        setReviews(rev);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error"))
      .finally(() => setLoading(false));
  }, [slugOrId, isUuid]);

  if (loading) {
    return (
      <section className="container mx-auto px-4 pb-24">
        <div className="mx-auto flex max-w-4xl items-center justify-center gap-3 py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          <span className="text-slate-400">{t("loading")}</span>
        </div>
      </section>
    );
  }

  if (error || !center) {
    return (
      <section className="container mx-auto px-4 pb-24">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg bg-red-500/20 px-4 py-3 text-red-400">
            {error ?? notFoundLabel}
          </div>
          <Link
            href="/centers"
            className="mt-6 inline-block text-cyan-400 hover:text-cyan-300"
          >
            ← {t("backToCenters")}
          </Link>
        </div>
      </section>
    );
  }

  const formatPrice = (amount: number | string) =>
    format.number(parseFloat(String(amount)) || 0, {
      style: "currency",
      currency: "EUR",
    });

  return (
    <section className="container mx-auto px-4 pb-24">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/centers"
          className="mb-8 inline-block text-sm text-slate-400 hover:text-cyan-400"
        >
          ← {t("backToCenters")}
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 rounded-2xl border border-cyan-500/20 bg-slate-800/30 p-8 backdrop-blur"
        >
          <h1 className="mb-4 text-xl font-bold text-white md:text-2xl lg:text-3xl">
            {center.name}
          </h1>
          {(center.city || center.country) && (
            <p className="mb-4 text-slate-400">
              {[center.city, center.postal_code, center.country]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
          {center.address && (
            <p className="mb-4 text-slate-300">{center.address}</p>
          )}
          {center.description && (
            <p className="mb-4 text-slate-300">{center.description}</p>
          )}
          {center.phone && (
            <p className="text-slate-400">
              {t("phone")}: {center.phone}
            </p>
          )}
          {center.website && (
            <a
              href={center.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-cyan-400 hover:text-cyan-300"
            >
              {center.website}
            </a>
          )}
        </motion.div>

        {services.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="mb-6 text-2xl font-semibold text-cyan-200">
              {t("services")}
            </h2>
                <div className="space-y-4">
              {services.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-slate-700 bg-slate-800/50 p-6"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="font-medium text-white">{s.name}</h3>
                      {s.description && (
                        <p className="text-sm text-slate-400">{s.description}</p>
                      )}
                      <p className="mt-1 text-sm text-slate-500">
                        {s.duration_minutes} min
                        {s.max_capacity ? ` • ${s.max_capacity} pers. max` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-semibold text-cyan-400">
                        {formatPrice(s.price)}
                      </span>
                      <Link
                        href={`/book/${center.id}/${s.id}`}
                        className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-500"
                      >
                        {t("book")}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {services.length === 0 && !loading && (
          <p className="text-slate-500">{t("noServices")}</p>
        )}

        {/* Reviews Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12"
        >
          <h2 className="mb-6 text-2xl font-semibold text-cyan-200">
            {tReviews("title")}
            {reviews.length > 0 && (
              <span className="ml-3 text-base font-normal text-slate-400">
                {tReviews("totalReviews", { count: reviews.length })}
              </span>
            )}
          </h2>

          {reviews.length > 0 && (
            <div className="mb-6 flex items-center gap-2">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, starIdx) => {
                  const avg =
                    reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
                  return (
                    <Star
                      key={`avg-star-${String(starIdx)}`}
                      className={`h-5 w-5 ${starIdx < Math.round(avg) ? "fill-amber-400 text-amber-400" : "text-slate-600"}`}
                    />
                  );
                })}
              </div>
              <span className="text-sm text-slate-400">
                {tReviews("averageRating")}:{" "}
                {(
                  reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
                ).toFixed(1)}
              </span>
            </div>
          )}

          {reviews.length === 0 ? (
            <p className="text-sm text-slate-500">{tReviews("noReviews")}</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl border border-slate-700 bg-slate-800/50 p-5"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, starIdx) => (
                        <Star
                          key={`review-star-${String(starIdx)}`}
                          className={`h-4 w-4 ${starIdx < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-600"}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-500">
                      {format.dateTime(new Date(review.created_at), { dateStyle: "medium" })}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="mt-2 text-sm text-slate-300">{review.comment}</p>
                  )}
                  {review.reply && (
                    <div className="mt-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                      <p className="text-xs font-medium text-cyan-400">
                        {tReviews("centerResponse")}
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        {review.reply}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Leave a review form */}
          {center && isAuthenticated() && (
            <ReviewForm
              centerId={center.id}
              onSubmitted={(r) => setReviews((prev) => [r, ...prev])}
            />
          )}
        </motion.div>
      </div>
    </section>
  );
}

function ReviewForm({
  centerId,
  onSubmitted,
}: {
  centerId: string;
  onSubmitted: (review: ReviewResponse) => void;
}) {
  const t = useTranslations("reviews");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewableBookings, setReviewableBookings] = useState<string[]>([]);
  const [selectedBooking, setSelectedBooking] = useState("");

  useEffect(() => {
    reviewApi
      .getReviewableBookings(centerId)
      .then(setReviewableBookings)
      .catch(() => {
        // User may not have completed bookings
      });
  }, [centerId]);

  if (reviewableBookings.length === 0) {return null;}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !selectedBooking) {return;}
    setSubmitting(true);
    try {
      const body: CreateReviewRequest = {
        booking_id: selectedBooking,
        center_id: centerId,
        rating,
        comment: comment || undefined,
      };
      const review = await reviewApi.create(body);
      onSubmitted(review);
      setRating(0);
      setComment("");
      setSelectedBooking("");
      setReviewableBookings((prev) =>
        prev.filter((id) => id !== selectedBooking)
      );
    } catch {
      // error handled silently
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 rounded-xl border border-slate-700 bg-slate-800/50 p-6"
    >
      <h3 className="mb-4 text-lg font-semibold text-cyan-200">
        {t("leaveReview")}
      </h3>

      {/* Rating */}
      <div className="mb-4">
        <label className="mb-2 block text-sm text-slate-300">{t("rating")}</label>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, starIdx) => (
            <button
              key={`input-star-${String(starIdx)}`}
              type="button"
              onClick={() => setRating(starIdx + 1)}
              className="transition-transform hover:scale-110"
              aria-label={t("starRating", { count: starIdx + 1 })}
            >
              <Star
                className={`h-7 w-7 ${starIdx < rating ? "fill-amber-400 text-amber-400" : "text-slate-600 hover:text-amber-400/50"}`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div className="mb-4">
        <label className="mb-1.5 block text-sm text-slate-300">
          {t("comment")}
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || rating === 0}
        className="rounded-lg bg-cyan-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyan-500 disabled:opacity-50"
      >
        {submitting ? "..." : t("submit")}
      </button>
    </form>
  );
}
