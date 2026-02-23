"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { allArticles, type BlogCategory } from "@/data/blog";
import { BlogCard } from "@/components/blog/blog-card";

type Filter = "all" | BlogCategory;

export function BlogClient() {
  const t = useTranslations("blog");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered =
    filter === "all"
      ? allArticles
      : allArticles.filter((a) => a.category === filter);

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: t("filterAll") },
    { key: "destinations", label: t("category_destinations") },
    { key: "tips", label: t("category_tips") },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <section className="relative pb-12">
        <div className="container relative z-10 mx-auto max-w-5xl px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4 text-2xl font-bold text-white sm:text-4xl lg:text-5xl"
          >
            {t("pageTitle")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto max-w-2xl text-lg text-slate-200/90"
          >
            {t("pageDescription")}
          </motion.p>
        </div>
      </section>

      {/* Filters + Grid */}
      <section className="relative pb-24">
        <div className="container mx-auto max-w-6xl px-4">
          {/* Filter tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-10 flex flex-wrap justify-center gap-2"
          >
            {filters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                  filter === f.key
                    ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-200 shadow-md shadow-cyan-500/10"
                    : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </motion.div>

          {/* Articles grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((article, i) => (
              <BlogCard key={article.slug} article={article} index={i} />
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="mt-12 text-center text-slate-400">
              {t("noArticles")}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
