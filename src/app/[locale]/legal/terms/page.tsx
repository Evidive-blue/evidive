"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

export default function TermsPage() {
  const t = useTranslations("legal.terms");

  const sections = [
    { title: t("intro_title"), text: t("intro_text") },
    { title: t("services_title"), text: t("services_text") },
    { title: t("bookings_title"), text: t("bookings_text") },
    { title: t("liability_title"), text: t("liability_text") },
  ];

  return (
    <div className="min-h-screen pb-16 pt-24">
      <div className="container mx-auto max-w-4xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="mb-8 text-4xl font-bold text-white">
            {t("title")}
          </h1>

          <div className="space-y-8 text-slate-300">
            {sections.map((section, index) => (
              <motion.section
                key={index}
                className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <h2 className="mb-4 text-2xl font-semibold text-white">
                  {section.title}
                </h2>
                <p>{section.text}</p>
              </motion.section>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
