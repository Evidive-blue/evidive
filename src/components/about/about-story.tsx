"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

const timeline = [
  { year: "2023", emoji: "💡", key: "idea" },
  { year: "2024", emoji: "🚀", key: "launch" },
  { year: "2025", emoji: "🌍", key: "expansion" },
  { year: "2026", emoji: "🤝", key: "partners" },
] as const;

export function AboutStory() {
  const t = useTranslations("about");

  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            {t("story.title")}
          </h2>
          <p className="text-lg text-white/60">{t("story.subtitle")}</p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-gradient-to-b from-cyan-500/50 via-blue-500/50 to-transparent" />

          <div className="space-y-12">
            {timeline.map((item, index) => (
              <motion.div
                key={item.year}
                className={`relative flex items-center ${
                  index % 2 === 0 ? "flex-row" : "flex-row-reverse"
                }`}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                {/* Content */}
                <div
                  className={`w-5/12 ${index % 2 === 0 ? "pr-8 text-right" : "pl-8 text-left"}`}
                >
                  <div className="glass rounded-2xl p-6">
                    <div className="mb-2 text-3xl">{item.emoji}</div>
                    <div className="mb-2 text-2xl font-bold text-cyan-400">
                      {item.year}
                    </div>
                    <p className="text-white/70">
                      {t(`story.timeline.${item.key}`)}
                    </p>
                  </div>
                </div>

                {/* Center dot */}
                <div className="absolute left-1/2 flex h-4 w-4 -translate-x-1/2 items-center justify-center">
                  <div className="h-4 w-4 rounded-full bg-cyan-500" />
                  <div className="absolute h-8 w-8 animate-ping rounded-full bg-cyan-500/30" />
                </div>

                {/* Empty space for other side */}
                <div className="w-5/12" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
