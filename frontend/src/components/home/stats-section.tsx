"use client";

import { Users, Building2, Globe2, Waves } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const stats = [
  { Icon: Users, valueKey: "statDiversValue", labelKey: "statDivers", iconClass: "text-cyan-400" },
  { Icon: Building2, valueKey: "statCentersValue", labelKey: "statCenters", iconClass: "text-teal-400" },
  { Icon: Globe2, valueKey: "statCountriesValue", labelKey: "statCountries", iconClass: "text-blue-400" },
  { Icon: Waves, valueKey: "statDivesValue", labelKey: "statDives", iconClass: "text-violet-400" },
] as const;

export function StatsSection() {
  const t = useTranslations("homepage");

  return (
    <section className="relative z-10 px-4 py-12">
      <div className="mx-auto max-w-6xl">
        {/* Title */}
        <motion.p
          className="mb-8 text-center text-sm font-medium uppercase tracking-widest text-slate-500"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          {t("statsTitle")}
        </motion.p>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-8">
          {stats.map(({ Icon, valueKey, labelKey, iconClass }, i) => (
            <motion.div
              key={valueKey}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-8 text-center backdrop-blur-sm transition-colors duration-300 hover:border-white/10 hover:bg-white/[0.04]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Icon
                className={cn("mb-1 h-6 w-6 transition-transform duration-300 group-hover:scale-110", iconClass)}
                aria-hidden
              />
              <span className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                {t(valueKey)}
              </span>
              <span className="text-sm text-slate-400">
                {t(labelKey)}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
