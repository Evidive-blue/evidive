"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Shield, ShieldCheck, Sparkles, Users } from "lucide-react";

const values = [
  { key: "trust", icon: ShieldCheck },
  { key: "safety", icon: Shield },
  { key: "experience", icon: Sparkles },
  { key: "community", icon: Users },
] as const;

export function AboutValues() {
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
            {t("values.title")}
          </h2>
          <p className="text-lg text-white/60">{t("values.subtitle")}</p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <motion.div
                key={value.key}
                className="glass group rounded-2xl p-6 transition-all hover:bg-white/10"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 transition-colors group-hover:bg-cyan-500/30">
                  <Icon className="h-6 w-6 text-cyan-400" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-white">
                  {t(`values.items.${value.key}.title`)}
                </h3>
                <p className="text-sm text-white/60">
                  {t(`values.items.${value.key}.description`)}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
