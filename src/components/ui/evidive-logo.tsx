"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface EviDiveLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * EviDive Logo - Uses the official logo image from evidive.whytcard.ai
 */
export function EviDiveLogo({ className, size = "md" }: EviDiveLogoProps) {
  const t = useTranslations("images");
  const sizes = {
    sm: { width: 80, height: 40, className: "h-7" },
    md: { width: 100, height: 50, className: "h-9" },
    lg: { width: 140, height: 70, className: "h-12" },
  };

  const { width, height, className: sizeClass } = sizes[size];

  return (
    <Image
      src="/evidive-logo.png"
      alt={t("evidiveLogo")}
      width={width}
      height={height}
      className={cn("w-auto transition-transform", sizeClass, className)}
      priority
    />
  );
}

/**
 * EviDive Logo (SVG version) - Fallback if image not available
 */
export function EviDiveLogoSvg({ className, size = "md" }: EviDiveLogoProps) {
  const sizes = {
    sm: { width: 80, height: 28 },
    md: { width: 100, height: 36 },
    lg: { width: 140, height: 48 },
  };

  const { width, height } = sizes[size];

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 140 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-label="EviDive"
    >
      {/* Decorative bubbles */}
      <circle cx="8" cy="12" r="4" fill="#22d3ee" fillOpacity="0.6" />
      <circle cx="16" cy="6" r="2.5" fill="#22d3ee" fillOpacity="0.4" />
      <circle cx="130" cy="40" r="3" fill="#22d3ee" fillOpacity="0.5" />
      <circle cx="136" cy="32" r="2" fill="#22d3ee" fillOpacity="0.3" />

      {/* Main text path - Script style "EviDive" */}
      <text
        x="20"
        y="38"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="32"
        fontStyle="italic"
        fontWeight="400"
        fill="white"
        letterSpacing="-1"
      >
        EviDiv
      </text>
      
      {/* Final 'e' with decorative curl */}
      <text
        x="108"
        y="38"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="32"
        fontStyle="italic"
        fontWeight="400"
        fill="white"
      >
        e
      </text>

      {/* Bubble accent on 'i' dots */}
      <circle cx="52" cy="14" r="3.5" fill="#22d3ee" />
      <circle cx="100" cy="14" r="3.5" fill="#22d3ee" />
      
      {/* Small highlight on bubbles */}
      <circle cx="51" cy="13" r="1" fill="white" fillOpacity="0.6" />
      <circle cx="99" cy="13" r="1" fill="white" fillOpacity="0.6" />
    </svg>
  );
}
