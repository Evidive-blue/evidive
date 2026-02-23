"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { XCircle, ArrowLeft, Home } from "lucide-react";

export function BookingCancelClient() {
  const t = useTranslations("booking");

  return (
    <section className="-mt-[calc(35vh+1rem)] flex min-h-svh items-center justify-center px-4 pb-8 pt-20 md:-mt-20">
      <div className="mx-auto max-w-lg text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20"
        >
          <XCircle className="h-10 w-10 text-red-400" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-3 text-xl font-bold text-white md:text-2xl lg:text-3xl"
        >
          {t("cancelTitle")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 text-slate-300"
        >
          {t("cancelMessage")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
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
