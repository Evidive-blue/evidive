"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Anchor } from "lucide-react";

export function AboutHero() {
  const t = useTranslations("about");

  return (
    <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden px-4 pt-20">
      {/* Anchor icon */}
      <motion.div
        className="absolute top-32 flex h-20 w-20 items-center justify-center rounded-full bg-cyan-500/20 backdrop-blur-sm"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Anchor className="h-10 w-10 text-cyan-400" />
      </motion.div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <motion.h1
          className="mb-6 text-5xl font-bold text-white sm:text-6xl md:text-7xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {t("hero.title")}
        </motion.h1>

        <motion.p
          className="text-xl text-white/70 sm:text-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {t("hero.subtitle")}
        </motion.p>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0 120L48 110C96 100 192 80 288 70C384 60 480 60 576 65C672 70 768 80 864 85C960 90 1056 90 1152 85C1248 80 1344 70 1392 65L1440 60V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z"
            fill="currentColor"
            className="text-slate-900/50"
          />
        </svg>
      </div>
    </section>
  );
}
