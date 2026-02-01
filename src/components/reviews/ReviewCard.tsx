"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { fr, enUS, es, it, de } from "date-fns/locale";
import { Pencil, Trash2, ExternalLink, AlertCircle, ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StarRatingDisplay } from "./StarRatingInput";
import type { ReviewStatus } from "@prisma/client";

const dateLocales: Record<string, Locale> = {
  fr,
  en: enUS,
  es,
  it,
  de,
};

interface ReviewCardProps {
  review: {
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
  };
  locale: string;
  onEdit?: (reviewId: string) => void;
  onDelete?: (reviewId: string) => void;
}

const statusColors: Record<ReviewStatus, string> = {
  PENDING: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  APPROVED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  REJECTED: "bg-red-500/20 text-red-400 border-red-500/30",
  SPAM: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export function ReviewCard({
  review,
  locale,
  onEdit,
  onDelete,
}: ReviewCardProps) {
  const t = useTranslations("reviews");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const dateLocale = dateLocales[locale] || enUS;
  const isPending = review.status === "PENDING";

  const handleDelete = () => {
    if (onDelete) {
      setIsDeleting(true);
      onDelete(review.id);
    }
  };

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
      <CardContent className="p-0">
        {/* Header with center info */}
        <div className="flex items-center gap-4 border-b border-white/10 p-4">
          {/* Center logo */}
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/10">
            {review.center.logoUrl ? (
              <Image
                src={review.center.logoUrl}
                alt={review.center.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-bold text-white/50">
                {review.center.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Center name and status */}
          <div className="flex-1 min-w-0">
            <h3 className="truncate font-semibold text-white">
              {review.center.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                  statusColors[review.status]
                )}
              >
                {t(`status.${review.status}`)}
              </span>
              {review.diveDate && (
                <span className="text-xs text-white/50">
                  {t("card.diveOn")}{" "}
                  {format(new Date(review.diveDate), "dd MMM yyyy", {
                    locale: dateLocale,
                  })}
                </span>
              )}
            </div>
          </div>

          {/* View center link */}
          <a
            href={`/${locale}/center/${review.center.slug}`}
            className="shrink-0 text-cyan-400 hover:text-cyan-300 transition-colors"
            title={t("viewCenter")}
          >
            <ExternalLink className="h-5 w-5" />
          </a>
        </div>

        {/* Review content */}
        <div className="p-4 space-y-4">
          {/* Rating */}
          <div className="flex items-center justify-between">
            <StarRatingDisplay value={review.rating} size="md" />
            <span className="text-xs text-white/50">
              {t("card.postedOn")}{" "}
              {format(new Date(review.createdAt), "dd MMM yyyy", {
                locale: dateLocale,
              })}
            </span>
          </div>

          {/* Comment */}
          <p className="text-sm text-white/80 whitespace-pre-wrap">
            {review.comment}
          </p>

          {/* Photos */}
          {review.photos.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {review.photos.map((photo, index) => (
                <div
                  key={index}
                  className="relative h-20 w-20 overflow-hidden rounded-lg bg-white/10"
                >
                  <Image
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Pending notice */}
          {isPending && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">{t("card.modifiable")}</p>
            </div>
          )}
        </div>

        {/* Actions (only for pending reviews) */}
        {isPending && (onEdit || onDelete) && (
          <div className="flex items-center justify-end gap-2 border-t border-white/10 p-3 bg-white/[0.02]">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(review.id)}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <Pencil className="h-4 w-4 mr-1.5" />
                {t("editReview")}
              </Button>
            )}
            {onDelete && (
              <>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/50">
                      {t("deleteModal.title")}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="text-white/70 hover:text-white hover:bg-white/10"
                    >
                      {t("deleteModal.cancel")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      {t("deleteModal.confirm")}
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    {t("deleteReview")}
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
