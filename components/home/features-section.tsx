"use client";

import { motion, useInView } from "framer-motion";
import { Compass, MousePointerClick, ShieldCheck } from "lucide-react";
import { useRef } from "react";
import { useTranslations } from "@/lib/i18n/use-translations";

const features = [
  {
    icon: Compass,
    key: "explore",
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    icon: MousePointerClick,
    key: "book",
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    icon: ShieldCheck,
    key: "dive",
    gradient: "from-indigo-500 to-purple-600",
  },
];

export function FeaturesSection() {
  const t = useTranslations("features");
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-32 cv-auto"
    >
      {/* Decorative elements - subtle glow effects */}
      <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <motion.span
            className="mb-4 inline-block rounded-full bg-cyan-500/10 px-4 py-1.5 text-sm font-medium text-cyan-600"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {t("badge")}
          </motion.span>
          <h2 className="text-4xl font-bold text-white sm:text-5xl">
            {t("sectionTitle")}
          </h2>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.key}
              className="group relative"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              {/* Card */}
              <motion.div
                className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-8 shadow-xl shadow-black/20 backdrop-blur-md transition-all duration-500"
                whileHover={{
                  y: -8,
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)",
                }}
              >
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                
                {/* Step number */}
                <motion.div
                  className="absolute -right-4 -top-4 text-8xl font-black text-white/10 transition-all duration-500 group-hover:text-cyan-400/20"
                  whileHover={{ scale: 1.1 }}
                >
                  {index + 1}
                </motion.div>

                <div className="relative">
                  {/* Icon */}
                  <motion.div
                    className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <feature.icon className="h-8 w-8" />
                  </motion.div>

                  {/* Content */}
                  <h3 className="mb-3 text-xl font-bold text-white">
                    {t(`${feature.key}.title`)}
                  </h3>
                  <p className="text-white/70 leading-relaxed">
                    {t(`${feature.key}.description`)}
                  </p>
                </div>

                {/* Bottom accent line */}
                <motion.div
                  className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
