"use client";

import { motion } from "framer-motion";
import { useTranslations, useLocale, useFormatter } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { BlogArticle } from "@/data/blog";
import type { Locale } from "@/i18n/routing";
import { BlogArticleContent } from "@/components/blog/blog-article-content";

interface ArticleClientProps {
  article: BlogArticle;
}

const CategoryBadgeColors: Record<string, string> = {
  destinations: "border-cyan-400/40 bg-cyan-500/15 text-cyan-300",
  tips: "border-amber-400/40 bg-amber-500/15 text-amber-300",
};

export function ArticleClient({ article }: ArticleClientProps) {
  const t = useTranslations("blog");
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const content = article.content[locale] ?? article.content.en;
  const badgeClass =
    CategoryBadgeColors[article.category] ?? CategoryBadgeColors.tips;

  return (
    <div className="relative overflow-hidden">
      <section className="relative pb-24 pt-16 sm:pt-24">
        <div className="container relative z-10 mx-auto max-w-3xl px-4">
          {/* Back link */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-cyan-300"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              {t("backToBlog")}
            </Link>
          </motion.div>

          {/* Article header */}
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-10"
          >
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}
              >
                {t(`category_${article.category}`)}
              </span>
              <time
                dateTime={article.date}
                className="text-sm text-slate-400"
              >
                {format.dateTime(new Date(article.date), {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
              <span className="flex items-center gap-1 text-sm text-slate-400">
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <path
                    strokeWidth="2"
                    strokeLinecap="round"
                    d="M12 6v6l4 2"
                  />
                </svg>
                {t("readingTime", { minutes: article.readingTime })}
              </span>
            </div>

            <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">
              {content.title}
            </h1>

            <p className="mt-4 text-lg leading-relaxed text-slate-300/90">
              {content.excerpt}
            </p>
          </motion.header>

          {/* Article body */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-ocean rounded-2xl p-6 sm:p-8 lg:p-10"
          >
            <BlogArticleContent body={content.body} />
          </motion.div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 text-center"
          >
            <Link
              href="/blog"
              className="btn-ocean-outline inline-flex items-center justify-center px-6 py-3 text-sm"
            >
              {t("backToBlog")}
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
