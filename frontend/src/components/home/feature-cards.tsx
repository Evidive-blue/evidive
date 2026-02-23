"use client";

import { Compass, MousePointerClick, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const features = [
  {
    Icon: Compass,
    key: "explore",
    titleKey: "exploreTitle",
    descKey: "exploreDesc",
    iconClass: "text-cyan-400",
    bgClass: "bg-cyan-500/15 dark:bg-cyan-500/20",
    cardClass: "feature-card-cyan",
    numberClass: "text-cyan-500/8 dark:text-cyan-400/15",
  },
  {
    Icon: MousePointerClick,
    key: "book",
    titleKey: "bookTitle",
    descKey: "bookDesc",
    iconClass: "text-teal-400",
    bgClass: "bg-teal-500/15 dark:bg-teal-500/20",
    cardClass: "feature-card-teal",
    numberClass: "text-teal-500/8 dark:text-teal-400/15",
  },
  {
    Icon: Shield,
    key: "confirm",
    titleKey: "confirmTitle",
    descKey: "confirmDesc",
    iconClass: "text-violet-400",
    bgClass: "bg-violet-500/15 dark:bg-violet-500/20",
    cardClass: "feature-card-violet",
    numberClass: "text-violet-500/8 dark:text-violet-400/15",
  },
] as const;

export function FeatureCards() {
  const t = useTranslations("howItWorks");

  return (
    <section className="relative z-10 px-4 pb-16 pt-4">
      <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-3 lg:gap-8">
        {features.map(({ Icon, key, titleKey, descKey, iconClass, bgClass, cardClass, numberClass }, i) => (
          <motion.article
            key={key}
            className={cn(
              "glass-ocean group relative overflow-hidden rounded-2xl",
              cardClass,
            )}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 + i * 0.12, ease: "easeOut" }}
          >
            <span
              className={cn("absolute -right-3 -top-6 text-[8rem] font-black select-none", numberClass)}
              aria-hidden
            >
              {i + 1}
            </span>
            <div className="relative p-6 sm:p-8">
              <div className={cn(
                "mb-5 inline-flex rounded-xl p-3 transition-all duration-300 group-hover:scale-110",
                bgClass,
              )}>
                <Icon
                  className={cn("h-7 w-7", iconClass)}
                  aria-hidden
                />
              </div>
              <h3 className="mb-3 text-lg font-bold tracking-tight text-white/95 dark:text-slate-100 sm:text-xl">
                {t(titleKey)}
              </h3>
              <p className="text-sm leading-relaxed text-slate-400 dark:text-slate-300 sm:text-base">
                {t(descKey)}
              </p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
