"use client";

import { motion } from "framer-motion";
import { useTranslations, useLocale, useFormatter } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { BlogArticle } from "@/data/blog";
import type { Locale } from "@/i18n/routing";

interface BlogCardProps {
  article: BlogArticle;
  index: number;
}

const CategoryBadgeColors: Record<string, string> = {
  destinations: "border-cyan-400/40 bg-cyan-500/15 text-cyan-300",
  tips: "border-amber-400/40 bg-amber-500/15 text-amber-300",
};

export function BlogCard({ article, index }: BlogCardProps) {
  const t = useTranslations("blog");
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const content = article.content[locale] ?? article.content.en;
  const badgeClass =
    CategoryBadgeColors[article.category] ?? CategoryBadgeColors.tips;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
    >
      <Link
        href={`/blog/${article.slug}`}
        className="glass-ocean group relative flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10"
      >
        {/* Image placeholder gradient */}
        <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span
              className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}
            >
              {t(`category_${article.category}`)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-3 flex items-center gap-3 text-xs text-slate-400">
            <time dateTime={article.date}>
              {format.dateTime(new Date(article.date), {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
            <span className="flex items-center gap-1">
              <ClockIcon />
              {t("readingTime", { minutes: article.readingTime })}
            </span>
          </div>

          <h2 className="mb-2 text-lg font-semibold leading-snug text-white transition-colors group-hover:text-cyan-300">
            {content.title}
          </h2>

          <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-300/80">
            {content.excerpt}
          </p>

          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-400 transition-colors group-hover:text-cyan-300">
            {t("readMore")}
            <ArrowIcon />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

function ClockIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <path strokeWidth="2" strokeLinecap="round" d="M12 6v6l4 2" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M17 8l4 4m0 0l-4 4m4-4H3"
      />
    </svg>
  );
}
