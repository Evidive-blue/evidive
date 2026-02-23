"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/navigation";
import { Search, CalendarDays } from "lucide-react";

export function HeroSection() {
  const t = useTranslations("hero");
  const tImages = useTranslations("images");
  const router = useRouter();

  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (destination.trim().length > 0) {
      params.set("q", destination.trim());
    }
    if (date.length > 0) {
      params.set("date", date);
    }
    const query = params.toString();
    router.push(`/centers${query.length > 0 ? `?${query}` : ""}`);
  }, [destination, date, router]);

  return (
    <section className="relative flex flex-col overflow-hidden px-4 pb-8">
      {/* Contenu hero */}
      <div className="relative z-10 flex flex-1 items-center justify-center">
        <div className="mx-auto max-w-5xl text-center">
          {/* Logo avec effet glow */}
          <motion.div
            className="mb-6 flex items-center justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div
              className="relative"
              animate={{
                filter: [
                  "drop-shadow(0 0 20px rgba(34, 211, 238, 0))",
                  "drop-shadow(0 0 40px rgba(34, 211, 238, 0.35)) drop-shadow(0 0 80px rgba(34, 211, 238, 0.1))",
                  "drop-shadow(0 0 20px rgba(34, 211, 238, 0))",
                ],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Image
                src="/evidive-logo.png"
                alt={tImages("evidiveLogo")}
                width={400}
                height={120}
                sizes="(max-width: 640px) 256px, (max-width: 768px) 320px, 384px"
                className="h-auto w-64 sm:w-80 md:w-96"
                priority
              />
            </motion.div>
          </motion.div>

          {/* Visible headline — matches original site style */}
          <motion.h1
            className="mb-4 text-2xl font-bold tracking-tight text-white dark:text-slate-100 sm:text-3xl md:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
          >
            {t("titleAlt")}
          </motion.h1>

          {/* Subtitle — value prop */}
          <motion.p
            className="mx-auto mb-6 max-w-2xl text-balance text-base leading-relaxed text-slate-300/80 dark:text-slate-200/90 sm:text-lg md:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          >
            {t("subtitle")}
          </motion.p>

          {/* Quick search bar */}
          <motion.div
            className="mx-auto mb-6 w-full max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45, ease: "easeOut" }}
          >
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-cyan-400/70">
              {t("quickSearchLabel")}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-md sm:flex-row sm:items-center sm:gap-0 sm:rounded-full sm:p-1.5"
            >
              {/* Destination input */}
              <div className="relative flex flex-1 items-center">
                <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" aria-hidden="true" />
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder={t("quickSearchPlaceholder")}
                  className="w-full rounded-xl bg-transparent py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-400/60 focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none sm:rounded-full"
                  aria-label={t("quickSearchPlaceholder")}
                />
              </div>

              {/* Separator */}
              <div className="hidden h-6 w-px bg-white/10 sm:block" aria-hidden="true" />

              {/* Date input */}
              <div className="relative flex items-center sm:w-44">
                <CalendarDays className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" aria-hidden="true" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl bg-transparent py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-400/60 focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:outline-none sm:rounded-full [&::-webkit-calendar-picker-indicator]:invert"
                  aria-label={t("quickSearchDate")}
                />
              </div>

              {/* Search button */}
              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:bg-cyan-400 hover:shadow-cyan-400/30 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none sm:rounded-full"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                <span>{t("quickSearchButton")}</span>
              </button>
            </form>
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          >
            <Link
              href="/centers"
              className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:bg-cyan-400 hover:shadow-cyan-400/30 dark:text-slate-100 dark:shadow-cyan-500/30 dark:hover:shadow-cyan-400/40"
            >
              {t("ctaExplore")}
            </Link>
            <Link
              href="/onboard/center"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-white/25 hover:bg-white/10 dark:border-slate-400/20 dark:bg-slate-800/30 dark:text-slate-100 dark:hover:border-slate-300/30 dark:hover:bg-slate-700/40"
            >
              {t("ctaCenter")}
            </Link>
          </motion.div>
        </div>
      </div>

    </section>
  );
}
