"use client";

import { Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RatingDistributionProps {
  distribution: Record<number, number>;
  totalCount: number;
  translations: {
    title: string;
    stars: string;
  };
}

export function RatingDistribution({
  distribution,
  totalCount,
  translations: t,
}: RatingDistributionProps) {
  // Calculate percentages
  const getPercentage = (count: number) => {
    if (totalCount === 0) return 0;
    return (count / totalCount) * 100;
  };

  // Rating rows from 5 to 1
  const ratings = [5, 4, 3, 2, 1];

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-lg text-white">{t.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {ratings.map((rating) => {
          const count = distribution[rating] || 0;
          const percentage = getPercentage(count);

          return (
            <div key={rating} className="flex items-center gap-3">
              {/* Stars label */}
              <div className="flex w-16 items-center gap-1 text-sm text-white/70">
                <span>{rating}</span>
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              </div>

              {/* Progress bar */}
              <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-400 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Count */}
              <div className="w-12 text-right text-sm text-white/50">
                {count}
              </div>
            </div>
          );
        })}

        {totalCount === 0 && (
          <p className="py-4 text-center text-sm text-white/50">
            Aucun avis pour le moment
          </p>
        )}
      </CardContent>
    </Card>
  );
}
