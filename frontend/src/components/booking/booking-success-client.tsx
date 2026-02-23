"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { CheckCircle, ArrowLeft, Home } from "lucide-react";

export function BookingSuccessClient() {
  const t = useTranslations("booking");

  useEffect(() => {
    // Fire confetti on mount
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#06b6d4", "#22d3ee", "#67e8f9"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#06b6d4", "#22d3ee", "#67e8f9"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  return (
    <section className="-mt-[calc(35vh+1rem)] flex min-h-svh items-center justify-center px-4 pb-8 pt-20 md:-mt-20">
      <div className="mx-auto max-w-lg text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20"
        >
          <CheckCircle className="h-10 w-10 text-emerald-400" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-3 text-xl font-bold text-white md:text-2xl lg:text-3xl"
        >
          {t("successTitle")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-2 text-slate-300"
        >
          {t("successMessage")}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8 text-sm text-slate-400"
        >
          {t("successDetails")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
        >
          <Link
            href="/centers"
            className="flex items-center gap-2 rounded-lg border border-slate-700 px-6 py-3 text-sm text-slate-300 transition-colors hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToCenter")}
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg bg-cyan-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-cyan-500"
          >
            <Home className="h-4 w-4" />
            {t("backToHome")}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
