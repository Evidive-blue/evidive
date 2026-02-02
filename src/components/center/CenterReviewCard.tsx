"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Star,
  MessageSquare,
  CheckCircle,
  Calendar,
  ImageIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewUser {
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}

interface CenterReviewCardProps {
  review: {
    id: string;
    rating: number;
    comment: string;
    photos: string[];
    createdAt: Date;
    centerResponse: string | null;
    centerResponseAt: Date | null;
    user: ReviewUser;
    serviceName: string | null;
  };
  locale: string;
  onRespondClick: (reviewId: string) => void;
  translations: {
    respond: string;
    responded: string;
    service: string;
    yourResponse: string;
    respondedOn: string;
    showPhotos: string;
    hidePhotos: string;
  };
}

function getUserDisplayName(user: ReviewUser): string {
  const firstName = user.firstName || "";
  const lastInitial = user.lastName ? user.lastName[0] + "." : "";
  return `${firstName} ${lastInitial}`.trim() || "Plongeur";
}

function getUserInitials(user: ReviewUser): string {
  const firstName = user.firstName || "";
  const lastName = user.lastName || "";
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  return firstName[0]?.toUpperCase() || "P";
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-4 w-4",
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-white/10 text-white/10"
          )}
        />
      ))}
    </div>
  );
}

function formatRelativeDate(date: Date, locale: string): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (days === 0) return rtf.format(0, "day");
  if (days === 1) return rtf.format(-1, "day");
  if (days < 7) return rtf.format(-days, "day");
  if (days < 30) return rtf.format(-Math.floor(days / 7), "week");
  if (days < 365) return rtf.format(-Math.floor(days / 30), "month");
  return rtf.format(-Math.floor(days / 365), "year");
}

function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function CenterReviewCard({
  review,
  locale,
  onRespondClick,
  translations: t,
}: CenterReviewCardProps) {
  const [showPhotos, setShowPhotos] = useState(false);
  const hasPhotos = review.photos && review.photos.length > 0;

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
      <CardContent className="p-5">
        {/* Header: User info + Rating */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            {review.user.avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={review.user.avatarUrl}
                alt={getUserDisplayName(review.user)}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-semibold text-white">
                {getUserInitials(review.user)}
              </div>
            )}

            {/* Name + Date */}
            <div>
              <p className="font-medium text-white">
                {getUserDisplayName(review.user)}
              </p>
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Calendar className="h-3 w-3" />
                <span>{formatRelativeDate(review.createdAt, locale)}</span>
              </div>
            </div>
          </div>

          {/* Rating */}
          <StarRating rating={review.rating} />
        </div>

        {/* Service used */}
        {review.serviceName && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            <span className="text-white/50">{t.service}:</span>
            <span>{review.serviceName}</span>
          </div>
        )}

        {/* Comment */}
        <p className="mt-4 text-sm leading-relaxed text-white/80">
          {review.comment}
        </p>

        {/* Photos toggle */}
        {hasPhotos && (
          <div className="mt-4">
            <button
              onClick={() => setShowPhotos(!showPhotos)}
              className="flex items-center gap-2 text-sm text-cyan-400 transition hover:text-cyan-300"
            >
              <ImageIcon className="h-4 w-4" />
              <span>
                {showPhotos ? t.hidePhotos : t.showPhotos} ({review.photos.length})
              </span>
              {showPhotos ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showPhotos && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {review.photos.map((photo, index) => (
                  <a
                    key={index}
                    href={photo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="aspect-square overflow-hidden rounded-lg"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="h-full w-full object-cover transition hover:scale-105"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Center Response */}
        {review.centerResponse ? (
          <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <div className="flex items-center gap-2 text-emerald-300">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{t.yourResponse}</span>
              {review.centerResponseAt && (
                <span className="text-xs text-emerald-300/60">
                  · {t.respondedOn} {formatDate(review.centerResponseAt, locale)}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-emerald-200/80">
              {review.centerResponse}
            </p>
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-sm text-white/50">
              Aucune réponse publiée
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRespondClick(review.id)}
              className="border-cyan-500/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 hover:text-cyan-100"
            >
              <MessageSquare className="mr-1.5 h-4 w-4" />
              {t.respond}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
