"use client";

import { useState } from "react";
import { CenterReviewCard } from "./CenterReviewCard";
import { ReviewResponseModal } from "./ReviewResponseModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Star, SlidersHorizontal, X } from "lucide-react";

interface ReviewUser {
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  photos: string[];
  createdAt: Date;
  centerResponse: string | null;
  centerResponseAt: Date | null;
  user: ReviewUser;
  serviceName: string | null;
}

interface CenterReviewsListProps {
  reviews: Review[];
  locale: string;
  translations: {
    sortBy: string;
    sortNewest: string;
    sortOldest: string;
    sortHighest: string;
    sortLowest: string;
    filterByRating: string;
    allRatings: string;
    starsFilter: string;
    clearFilters: string;
    noReviews: string;
    noReviewsFiltered: string;
    showingResults: string;
    card: {
      respond: string;
      responded: string;
      service: string;
      yourResponse: string;
      respondedOn: string;
      showPhotos: string;
      hidePhotos: string;
    };
    modal: {
      title: string;
      description: string;
      responseLabel: string;
      responsePlaceholder: string;
      cancel: string;
      submit: string;
      submitting: string;
      success: string;
      error: string;
      minLength: string;
      maxLength: string;
      alreadyResponded: string;
    };
  };
}

type SortOption = "newest" | "oldest" | "highest" | "lowest";

export function CenterReviewsList({
  reviews,
  locale,
  translations: t,
}: CenterReviewsListProps) {
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter reviews
  const filteredReviews = reviews.filter((review) => {
    if (filterRating === "all") return true;
    return review.rating === parseInt(filterRating);
  });

  // Sort reviews
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "highest":
        return b.rating - a.rating;
      case "lowest":
        return a.rating - b.rating;
      default:
        return 0;
    }
  });

  const hasFilters = filterRating !== "all";

  const handleRespondClick = (reviewId: string) => {
    setSelectedReviewId(reviewId);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedReviewId(null);
  };

  const clearFilters = () => {
    setFilterRating("all");
    setSortBy("newest");
  };

  return (
    <div className="space-y-6">
      {/* Filters and Sort */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Sort */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-white/50" />
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortOption)}
            >
              <SelectTrigger className="w-[160px] border-white/10 bg-white/5 text-white">
                <SelectValue placeholder={t.sortBy} />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-slate-900">
                <SelectItem value="newest">{t.sortNewest}</SelectItem>
                <SelectItem value="oldest">{t.sortOldest}</SelectItem>
                <SelectItem value="highest">{t.sortHighest}</SelectItem>
                <SelectItem value="lowest">{t.sortLowest}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter by rating */}
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-white/50" />
            <Select value={filterRating} onValueChange={setFilterRating}>
              <SelectTrigger className="w-[140px] border-white/10 bg-white/5 text-white">
                <SelectValue placeholder={t.filterByRating} />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-slate-900">
                <SelectItem value="all">{t.allRatings}</SelectItem>
                <SelectItem value="5">5 {t.starsFilter}</SelectItem>
                <SelectItem value="4">4 {t.starsFilter}</SelectItem>
                <SelectItem value="3">3 {t.starsFilter}</SelectItem>
                <SelectItem value="2">2 {t.starsFilter}</SelectItem>
                <SelectItem value="1">1 {t.starsFilter}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear filters */}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-white/60 hover:bg-white/10 hover:text-white"
            >
              <X className="mr-1 h-4 w-4" />
              {t.clearFilters}
            </Button>
          )}
        </div>

        {/* Results count */}
        <p className="text-sm text-white/50">
          {t.showingResults.replace("{count}", String(sortedReviews.length))}
        </p>
      </div>

      {/* Reviews List */}
      {sortedReviews.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
          <Star className="mx-auto h-12 w-12 text-white/20" />
          <h3 className="mt-4 text-lg font-medium text-white">
            {hasFilters ? t.noReviewsFiltered : t.noReviews}
          </h3>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedReviews.map((review) => (
            <CenterReviewCard
              key={review.id}
              review={review}
              locale={locale}
              onRespondClick={handleRespondClick}
              translations={t.card}
            />
          ))}
        </div>
      )}

      {/* Response Modal */}
      <ReviewResponseModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        reviewId={selectedReviewId}
        translations={t.modal}
      />
    </div>
  );
}
