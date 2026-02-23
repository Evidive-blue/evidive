"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

export function CareersClient() {
  const t = useTranslations("careers");

  const benefits = [
    t("benefit1"),
    t("benefit2"),
    t("benefit3"),
    t("benefit4"),
  ];

  return (
    <section className="container mx-auto px-4 pb-24">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-16 text-center"
        >
          <h1 className="mb-4 text-2xl font-bold text-white md:text-3xl lg:text-4xl">{t("title")}</h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-300">
            {t("subtitle")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-16 rounded-2xl border border-cyan-500/20 bg-slate-800/30 p-8 backdrop-blur"
        >
          <h2 className="mb-4 text-2xl font-semibold text-cyan-200">
            {t("benefitsTitle")}
          </h2>
          <p className="mb-6 text-slate-300">{t("benefitsDesc")}</p>
          <ul className="grid gap-4 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <li
                key={benefit}
                className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3"
              >
                <span className="text-cyan-400">✓</span>
                <span className="text-slate-200">{benefit}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <h2 className="mb-6 text-2xl font-semibold text-cyan-200">
            {t("openPositions")}
          </h2>
          <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-8 text-center">
            <p className="mb-6 text-slate-300">{t("noPositions")}</p>
            <Link
              href="/contact"
              className="inline-flex items-center rounded-lg bg-cyan-600 px-6 py-3 font-medium text-white transition-colors hover:bg-cyan-500"
            >
              {t("apply")}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
