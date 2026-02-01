"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, MessageSquare, TrendingUp } from "lucide-react";

interface CenterReviewStatsProps {
  averageRating: number;
  totalReviews: number;
  translations: {
    averageRating: string;
    totalReviews: string;
    outOf5: string;
    reviews: string;
  };
}

export function CenterReviewStats({
  averageRating,
  totalReviews,
  translations: t,
}: CenterReviewStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Average Rating Card */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white/70">
            {t.averageRating}
          </CardTitle>
          <Star className="h-5 w-5 text-yellow-400" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">
              {averageRating.toFixed(1)}
            </span>
            <span className="text-sm text-white/50">{t.outOf5}</span>
          </div>
          <div className="mt-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= Math.round(averageRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-white/10 text-white/10"
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Total Reviews Card */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-white/70">
            {t.totalReviews}
          </CardTitle>
          <MessageSquare className="h-5 w-5 text-cyan-400" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white">{totalReviews}</span>
            <span className="text-sm text-white/50">{t.reviews}</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm text-white/50">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span>Avis approuvés</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
