"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { Star, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { TableSkeleton } from "@/components/admin/loading-skeleton";
import { EmptyState } from "@/components/admin/empty-state";
import { ConfirmDialog, useConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";

interface AdminReviewData {
  id: string;
  client_display_name: string | null;
  center_name: string | null;
  rating: number;
  comment: string | null;
  reply: string | null;
  is_published: boolean | null;
  created_at: string;
}

export function AdminReviewsClient() {
  const t = useTranslations("admin");
  const format = useFormatter();
  const confirmDialog = useConfirmDialog();
  const [reviews, setReviews] = useState<AdminReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await adminApi.getReviews();
      const mapped: AdminReviewData[] = (raw as unknown as AdminReviewData[]).map((r) => ({
        id: r.id,
        client_display_name: r.client_display_name ?? null,
        center_name: r.center_name ?? null,
        rating: r.rating ?? 0,
        comment: r.comment ?? null,
        reply: r.reply ?? null,
        is_published: r.is_published ?? null,
        created_at: r.created_at,
      }));
      setReviews(mapped);
    } catch {
      const errorMessage = t("loadError");
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTogglePublish = useCallback(
    async (id: string, currentlyPublished: boolean) => {
      setTogglingId(id);
      try {
        await adminApi.toggleReviewPublish(id, !currentlyPublished);
        toast.success(
          currentlyPublished ? t("reviewUnpublished") : t("reviewApproved")
        );
        loadData();
      } catch {
        toast.error(t("saveError"));
      } finally {
        setTogglingId(null);
      }
    },
    [t, loadData]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      confirmDialog.confirm({
        title: t("confirmDeleteReview"),
        description: t("confirmDeleteReviewDescription"),
        onConfirm: async () => {
          setDeletingId(id);
          try {
            await adminApi.deleteReview(id);
            toast.success(t("reviewDeleted"));
            loadData();
          } catch {
            toast.error(t("saveError"));
          } finally {
            setDeletingId(null);
          }
        },
      });
    },
    [t, loadData, confirmDialog]
  );

  const formatDate = (dateString: string): string =>
    format.dateTime(new Date(dateString), {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const getPublishBadge = (isPublished: boolean | null) => {
    if (isPublished === true) {
      return "bg-emerald-500/20 text-emerald-400";
    }
    if (isPublished === false) {
      return "bg-amber-500/20 text-amber-400";
    }
    return "bg-slate-500/20 text-slate-400";
  };

  const getPublishLabel = (isPublished: boolean | null): string => {
    if (isPublished === true) return t("published");
    if (isPublished === false) return t("unpublished");
    return "—";
  };

  if (loading) {
    return <TableSkeleton rows={5} cols={3} />;
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-500/20 px-4 py-3 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader titleKey="reviews" />

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={confirmDialog.onOpenChange}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={t("delete")}
        cancelLabel={t("close")}
        variant="destructive"
        onConfirm={confirmDialog.onConfirm}
      />

      {reviews.length === 0 ? (
        <EmptyState title={t("noResults")} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-5"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2">
                    <div className="text-sm font-medium text-white">
                      {review.client_display_name ?? "—"}
                    </div>
                  </div>
                  <div className="text-sm text-slate-300">
                    {t("center")}: {review.center_name ?? "—"}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${getPublishBadge(review.is_published)}`}
                >
                  {getPublishLabel(review.is_published)}
                </span>
              </div>

              <div className="mb-3 flex items-center gap-2">
                <Stars rating={review.rating} />
              </div>

              {review.comment && (
                <div className="mb-3 rounded-lg bg-slate-800/50 p-3">
                  <p className="text-sm text-slate-300">{review.comment}</p>
                </div>
              )}

              {review.reply && (
                <div className="mb-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
                  <p className="mb-1 text-xs font-medium text-cyan-400">
                    {t("centerResponse")}
                  </p>
                  <p className="text-sm text-slate-300">
                    {review.reply}
                  </p>
                </div>
              )}

              <div className="mb-4 text-xs text-slate-500">
                {formatDate(review.created_at)}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleTogglePublish(review.id, review.is_published === true)}
                  disabled={togglingId === review.id}
                  className={
                    review.is_published
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }
                  size="sm"
                >
                  {togglingId === review.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : review.is_published ? (
                    <EyeOff className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                  {review.is_published ? t("unpublish") : t("publish")}
                </Button>
                <Button
                  onClick={() => handleDelete(review.id)}
                  disabled={deletingId === review.id}
                  variant="ghost"
                  size="icon-sm"
                  className="text-red-400 hover:text-red-300"
                  title={t("delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
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
          className={`h-4 w-4 ${
            starIndex < rating
              ? "fill-amber-400 text-amber-400"
              : "text-slate-600"
          }`}
        />
      ))}
    </div>
  );
}
