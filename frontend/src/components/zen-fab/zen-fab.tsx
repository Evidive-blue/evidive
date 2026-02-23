"use client";

import { motion } from "framer-motion";
import { Sparkles, Leaf } from "lucide-react";
import { useTranslations } from "next-intl";
import { useReducedEffects } from "@/components/reduced-effects-provider";
import { cn } from "@/lib/utils";

/**
 * ZenFab — Fixed floating action button (left side) that toggles
 * reduced-effects mode (disables heavy animations & background effects).
 *
 * - Active (zen): green tint, leaf icon
 * - Inactive (full effects): cyan tint, sparkles icon
 */
export function ZenFab(): React.JSX.Element {
  const t = useTranslations("zenFab");
  const { isReduced, toggle } = useReducedEffects();

  return (
    <div className="fixed bottom-20 left-4 z-40 md:bottom-6 md:left-6">
      <motion.button
        onClick={toggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
          isReduced
            ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/30 hover:shadow-emerald-500/50 focus-visible:ring-emerald-400"
            : "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-cyan-500/30 hover:shadow-cyan-500/50 focus-visible:ring-cyan-400",
        )}
        aria-label={isReduced ? t("enableEffects") : t("disableEffects")}
        title={isReduced ? t("enableEffects") : t("disableEffects")}
      >
        {isReduced ? (
          <Leaf className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        )}
      </motion.button>
    </div>
  );
}
