"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { X, Loader2, ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { StarRatingInput } from "./StarRatingInput";
import { createReview, updateReview } from "@/app/[locale]/reviews/actions";

interface ReviewFormProps {
  mode: "create" | "edit";
  bookingId?: string;
  reviewId?: string;
  initialData?: {
    rating: number;
    comment: string;
    photos: string[];
  };
  centerName?: string;
  serviceName?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ReviewForm({
  mode,
  bookingId,
  reviewId,
  initialData,
  centerName,
  serviceName,
  onClose,
  onSuccess,
}: ReviewFormProps) {
  const t = useTranslations("reviews.form");
  const [isPending, startTransition] = useTransition();
  
  const [rating, setRating] = useState(initialData?.rating ?? 0);
  const [comment, setComment] = useState(initialData?.comment ?? "");
  const [photos, setPhotos] = useState<string[]>(initialData?.photos ?? []);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isValid = rating > 0 && comment.length >= 20;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError(t("ratingRequired"));
      return;
    }

    if (comment.length < 20) {
      setError(t("commentMin"));
      return;
    }

    const formData = new FormData();
    formData.set("rating", String(rating));
    formData.set("comment", comment);
    formData.set("photos", JSON.stringify(photos));

    if (mode === "create" && bookingId) {
      formData.set("bookingId", bookingId);
    } else if (mode === "edit" && reviewId) {
      formData.set("reviewId", reviewId);
    }

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createReview(formData)
          : await updateReview(formData);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1500);
      } else {
        setError(result.error || t("error"));
      }
    });
  };

  const handleAddPhoto = () => {
    // For now, we'll use a URL input. In production, this would use file upload
    const url = prompt("Enter image URL:");
    if (url && photos.length < 3) {
      setPhotos([...photos, url]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-lg border-white/10 bg-slate-900/95 backdrop-blur-xl">
        <CardHeader className="border-b border-white/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">
              {mode === "create" ? t("title") : t("editTitle")}
            </CardTitle>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {(centerName || serviceName) && (
            <p className="text-sm text-white/60 mt-1">
              {centerName}
              {serviceName && ` · ${serviceName}`}
            </p>
          )}
        </CardHeader>

        <CardContent className="p-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                <svg
                  className="h-8 w-8 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-white font-medium">
                {mode === "create" ? t("success") : t("updateSuccess")}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  {t("rating")} *
                </label>
                <StarRatingInput
                  value={rating}
                  onChange={setRating}
                  disabled={isPending}
                  size="lg"
                />
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <label
                  htmlFor="comment"
                  className="text-sm font-medium text-white"
                >
                  {t("comment")} *
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t("commentPlaceholder")}
                  disabled={isPending}
                  rows={5}
                  className={cn(
                    "w-full rounded-xl border bg-white/5 px-4 py-3 text-white placeholder:text-white/40",
                    "focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    comment.length > 0 && comment.length < 20
                      ? "border-amber-500/50"
                      : "border-white/10"
                  )}
                />
                <div className="flex justify-between text-xs">
                  <span
                    className={cn(
                      comment.length > 0 && comment.length < 20
                        ? "text-amber-400"
                        : "text-white/40"
                    )}
                  >
                    {comment.length > 0 && comment.length < 20 && t("commentMin")}
                  </span>
                  <span className="text-white/40">{comment.length}/2000</span>
                </div>
              </div>

              {/* Photos */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">
                  {t("photos")}
                </label>
                <p className="text-xs text-white/50">{t("photosHint")}</p>

                <div className="flex gap-2 flex-wrap">
                  {photos.map((photo, index) => (
                    <div
                      key={index}
                      className="relative h-20 w-20 overflow-hidden rounded-lg bg-white/10 group"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        disabled={isPending}
                        className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-5 w-5 text-red-400" />
                      </button>
                    </div>
                  ))}

                  {photos.length < 3 && (
                    <button
                      type="button"
                      onClick={handleAddPhoto}
                      disabled={isPending}
                      className={cn(
                        "flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-white/20",
                        "text-white/40 hover:text-white/60 hover:border-white/40 transition-colors",
                        "disabled:cursor-not-allowed disabled:opacity-50"
                      )}
                    >
                      <ImagePlus className="h-6 w-6" />
                    </button>
                  )}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  disabled={isPending}
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || !isValid}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("submitting")}
                    </>
                  ) : mode === "create" ? (
                    t("submit")
                  ) : (
                    t("update")
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
