"use client";

import { ArrowRight, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function CTASection() {
  const t = useTranslations("homepage");

  return (
    <section className="relative z-10 px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <motion.div
          className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent p-8 text-center backdrop-blur-sm sm:p-12 lg:p-16 dark:border-slate-400/20 dark:from-cyan-500/15 dark:via-slate-800/30 dark:to-transparent"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          {/* Background glow */}
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-cyan-500/10 blur-3xl dark:bg-cyan-500/15"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-blue-500/10 blur-3xl dark:bg-blue-500/15"
            aria-hidden
          />

          <h2 className="relative mb-4 text-xl font-bold tracking-tight text-white dark:text-slate-100 sm:text-3xl lg:text-4xl">
            {t("ctaTitle")}
          </h2>
          <p className="relative mx-auto mb-10 max-w-xl text-base leading-relaxed text-slate-300/80 dark:text-slate-200/90 sm:text-lg">
            {t("ctaSubtitle")}
          </p>

          {/* Buttons */}
          <div className="relative flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/centers"
              className="group inline-flex items-center gap-2 rounded-full bg-cyan-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:bg-cyan-400 hover:shadow-cyan-400/30 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent dark:text-slate-100 dark:shadow-cyan-500/30 dark:hover:shadow-cyan-400/40 dark:focus-visible:ring-offset-slate-900"
            >
              {t("ctaExplore")}
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/onboard/center"
              className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-white/25 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent dark:border-slate-400/20 dark:bg-slate-800/30 dark:text-slate-100 dark:hover:border-slate-300/30 dark:hover:bg-slate-700/40 dark:focus-visible:ring-slate-400 dark:focus-visible:ring-offset-slate-900"
            >
              <Building2 className="h-4 w-4" />
              {t("ctaRegister")}
            </Link>
          </div>

          <p className="relative mt-6 text-xs text-slate-500 dark:text-slate-400">
            {t("ctaFree")}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
