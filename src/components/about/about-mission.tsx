"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Target } from "lucide-react";

export function AboutMission() {
  const t = useTranslations("about");

  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="glass overflow-hidden rounded-3xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10" />

          <div className="relative p-8 sm:p-12">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/20">
                <Target className="h-7 w-7 text-cyan-400" />
              </div>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                {t("mission.title")}
              </h2>
            </div>

            <p className="text-lg leading-relaxed text-white/80 sm:text-xl">
              {t("mission.description")}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
