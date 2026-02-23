"use client";

import { ShieldCheck, CalendarCheck, Globe, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const benefits = [
  {
    Icon: ShieldCheck,
    titleKey: "certified",
    descKey: "certifiedDesc",
    iconClass: "text-emerald-400",
    bgClass: "bg-emerald-500/15",
    borderClass: "hover:border-emerald-500/30",
  },
  {
    Icon: CalendarCheck,
    titleKey: "bookSimple",
    descKey: "bookSimpleDesc",
    iconClass: "text-cyan-400",
    bgClass: "bg-cyan-500/15",
    borderClass: "hover:border-cyan-500/30",
  },
  {
    Icon: Globe,
    titleKey: "diversity",
    descKey: "diversityDesc",
    iconClass: "text-blue-400",
    bgClass: "bg-blue-500/15",
    borderClass: "hover:border-blue-500/30",
  },
  {
    Icon: Sparkles,
    titleKey: "memorable",
    descKey: "memorableDesc",
    iconClass: "text-amber-400",
    bgClass: "bg-amber-500/15",
    borderClass: "hover:border-amber-500/30",
  },
] as const;

export function WhyUsSection() {
  const t = useTranslations("whyUs");

  return (
    <section className="relative z-10 px-4 py-16">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          className="mb-10 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-4 text-xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
            {t("title")}
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
          {benefits.map(({ Icon, titleKey, descKey, iconClass, bgClass, borderClass }, i) => (
            <motion.article
              key={titleKey}
              className={cn(
                "group relative rounded-2xl border border-white/5 bg-white/[0.03] p-6 backdrop-blur-sm transition-all duration-300 sm:p-8",
                borderClass,
              )}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div
                className={cn(
                  "mb-5 inline-flex rounded-xl p-3 transition-transform duration-300 group-hover:scale-110",
                  bgClass,
                )}
              >
                <Icon className={cn("h-7 w-7", iconClass)} aria-hidden />
              </div>
              <h3 className="mb-3 text-lg font-semibold tracking-tight text-white/95 sm:text-xl">
                {t(titleKey)}
              </h3>
              <p className="text-sm leading-relaxed text-slate-400 sm:text-base">
                {t(descKey)}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
