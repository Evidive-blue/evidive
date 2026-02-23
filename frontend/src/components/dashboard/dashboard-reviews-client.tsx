"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { toast } from "sonner";
import {
  centerApi,
  reviewApi,
  type ReviewResponse,
  type CenterResponse,
} from "@/lib/api";
import { Star, MessageSquare, Send } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { PageSkeleton } from "@/components/admin/loading-skeleton";
import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DashboardReviewsClient() {
  const t = useTranslations("dashboard");
  const format = useFormatter();
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const profile: CenterResponse = await centerApi.getProfile();
      const data = await reviewApi.getCenterReviews(profile.id);
      setReviews(data);
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRespond = async (reviewId: string) => {
    if (!responseText.trim()) {return;}
    setSending(true);
    try {
      await centerApi.respondToReview(reviewId, responseText);
      toast.success(t("responseSubmitted"));
      setRespondingTo(null);
      setResponseText("");
      load();
    } catch {
      toast.error(t("saveError"));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="reviews"
        namespace="dashboard"
      >
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          {avgRating} &middot; {reviews.length} {t("reviews").toLowerCase()}
        </div>
      </PageHeader>

      {reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title={t("noReviews")}
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-slate-800 bg-slate-900 p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Stars rating={review.rating} />
                    <span className="text-xs text-slate-500">
                      {format.dateTime(new Date(review.created_at), { dateStyle: "medium" })}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="mt-2 text-sm text-slate-300">{review.comment}</p>
                  )}
                </div>
              </div>

              {/* Center response */}
              {review.center_response && (
                <div className="mt-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                  <p className="text-xs font-medium text-cyan-400">
                    {t("yourResponse")}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    {review.center_response}
                  </p>
                </div>
              )}

              {/* Respond form */}
              {!review.center_response && (
                <>
                  {respondingTo === review.id ? (
                    <div className="mt-3 flex gap-2">
                      <Input
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder={t("yourResponse")}
                        className="flex-1 bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                      />
                      <Button
                        onClick={() => handleRespond(review.id)}
                        disabled={sending || !responseText.trim()}
                        className="bg-cyan-600 hover:bg-cyan-700 text-white"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => {
                          setRespondingTo(null);
                          setResponseText("");
                        }}
                        variant="outline"
                        className="border-slate-700 bg-slate-800 text-slate-400"
                      >
                        &times;
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setRespondingTo(review.id)}
                      variant="ghost"
                      className="mt-3 text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      {t("respondToReview")}
                    </Button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, starIndex) => (
        <Star
          key={`star-${String(starIndex)}`}
          className={`h-4 w-4 ${starIndex < rating ? "fill-amber-400 text-amber-400" : "text-slate-600"}`}
        />
      ))}
    </div>
  );
}
