"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function StarRatingInput({
  value,
  onChange,
  disabled = false,
  size = "md",
  showLabel = true,
}: StarRatingInputProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const t = useTranslations("reviews.stars");

  const displayValue = hoverValue ?? value;

  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-7 w-7",
    lg: "h-9 w-9",
  };

  const labels: Record<number, string> = {
    1: t("1"),
    2: t("2"),
    3: t("3"),
    4: t("4"),
    5: t("5"),
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHoverValue(star)}
            onMouseLeave={() => setHoverValue(null)}
            className={cn(
              "transition-all duration-150",
              disabled
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer hover:scale-110"
            )}
            aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
          >
            <Star
              className={cn(
                sizeClasses[size],
                "transition-colors duration-150",
                star <= displayValue
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-white/30"
              )}
            />
          </button>
        ))}
      </div>
      {showLabel && displayValue > 0 && (
        <span className="text-sm text-white/70">{labels[displayValue]}</span>
      )}
    </div>
  );
}

// Read-only star display component
interface StarRatingDisplayProps {
  value: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
}

export function StarRatingDisplay({
  value,
  size = "sm",
  showValue = false,
}: StarRatingDisplayProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClasses[size],
            star <= value
              ? "fill-amber-400 text-amber-400"
              : "fill-transparent text-white/30"
          )}
        />
      ))}
      {showValue && (
        <span className="ml-1 text-sm font-medium text-white/80">
          {value}/5
        </span>
      )}
    </div>
  );
}
