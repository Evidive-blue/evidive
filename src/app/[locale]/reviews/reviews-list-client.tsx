"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Star, MessageSquarePlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { PendingReviewsList } from "@/components/reviews/PendingReviewsList";
import { deleteReview } from "./actions";
import type { ReviewStatus } from "@prisma/client";

interface Review {
  id: string;
  rating: number;
  comment: string;
  photos: string[];
  status: ReviewStatus;
  createdAt: Date;
  diveDate: Date | null;
  center: {
    id: string;
    slug: string;
    name: string;
    logoUrl: string | null;
  };
}

interface PendingBooking {
  id: string;
  reference: string;
  diveDate: Date;
  diveTime: Date;
  center: {
    id: string;
    slug: string;
    name: unknown;
    logoUrl: string | null;
    city: string;
    country: string;
  };
  service: {
    id: string;
    name: unknown;
  };
}

interface ReviewsListClientProps {
  reviews: Review[];
  pendingBookings: PendingBooking[];
  locale: string;
}

export function ReviewsListClient({
  reviews,
  pendingBookings,
  locale,
}: ReviewsListClientProps) {
  const t = useTranslations("reviews");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Edit modal state
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  const handleEdit = (reviewId: string) => {
    const review = reviews.find((r) => r.id === reviewId);
    if (review) {
      setEditingReview(review);
    }
  };

  const handleDelete = (reviewId: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("reviewId", reviewId);
      await deleteReview(formData);
      router.refresh();
    });
  };

  const handleReviewCreated = () => {
    router.refresh();
  };

  const handleEditSuccess = () => {
    setEditingReview(null);
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {/* Pending bookings waiting for reviews */}
      {pendingBookings.length > 0 && (
        <PendingReviewsList
          bookings={pendingBookings}
          locale={locale}
          onReviewCreated={handleReviewCreated}
        />
      )}

      {/* User's reviews */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-white flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-400" />
            {t("myReviews")}
            <span className="ml-auto text-sm font-normal text-white/50">
              {reviews.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                <Star className="h-8 w-8 text-white/40" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-white">
                {t("noReviews")}
              </h3>
              <p className="max-w-sm text-sm text-white/60">
                {t("noReviewsDesc")}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  locale={locale}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit modal */}
      {editingReview && (
        <ReviewForm
          mode="edit"
          reviewId={editingReview.id}
          initialData={{
            rating: editingReview.rating,
            comment: editingReview.comment,
            photos: editingReview.photos,
          }}
          centerName={editingReview.center.name}
          onClose={() => setEditingReview(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
