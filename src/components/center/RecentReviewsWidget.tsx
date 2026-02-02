"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { Star, MessageSquare, ChevronRight, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewUser {
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  centerResponse: string | null;
  user: ReviewUser;
}

interface RecentReviewsWidgetProps {
  reviews: Review[];
  centerSlug?: string;
  translations: {
    title: string;
    emptyTitle: string;
    emptyDescription: string;
    respond: string;
    responded: string;
    viewAll: string;
  };
}

function getUserName(user: ReviewUser): string {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.join(" ") || "Plongeur";
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

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days} jours`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)} semaines`;
  return `Il y a ${Math.floor(days / 30)} mois`;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

export function RecentReviewsWidget({
  reviews,
  centerSlug,
  translations: t,
}: RecentReviewsWidgetProps) {
  const basePath = centerSlug ? `/center/manage/${centerSlug}` : "/center";

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between border-b border-white/10">
        <CardTitle className="text-lg text-white">{t.title}</CardTitle>
        <Link
          href={`${basePath}/reviews`}
          className="flex items-center gap-1 text-sm text-cyan-400 transition hover:text-cyan-300"
        >
          {t.viewAll}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent className="p-4">
        {reviews.length === 0 ? (
          <div className="py-6 text-center">
            <Star className="mx-auto h-10 w-10 text-white/20" />
            <h3 className="mt-3 text-base font-medium text-white/80">
              {t.emptyTitle}
            </h3>
            <p className="mt-1 text-sm text-white/50">{t.emptyDescription}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {review.user.avatarUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={review.user.avatarUrl}
                        alt={getUserName(review.user)}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-medium text-white">
                        {getUserInitials(review.user)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-white">
                        {getUserName(review.user)}
                      </p>
                      <p className="text-xs text-white/50">
                        {formatRelativeDate(review.createdAt)}
                      </p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} />
                </div>

                <p className="mt-3 text-sm text-white/70">
                  {truncateText(review.comment, 120)}
                </p>

                {review.centerResponse ? (
                  <div className="mt-3 flex items-center gap-2 text-xs text-emerald-300">
                    <CheckCircle className="h-4 w-4" />
                    {t.responded}
                  </div>
                ) : (
                  <Link href={`${basePath}/reviews/${review.id}/respond`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 border-cyan-500/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 hover:text-cyan-100"
                    >
                      <MessageSquare className="mr-1 h-4 w-4" />
                      {t.respond}
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
