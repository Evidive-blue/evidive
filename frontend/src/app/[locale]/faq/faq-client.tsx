"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** FAQ groups and their question keys */
const FAQ_GROUPS = [
  {
    groupKey: "general",
    questions: ["q1", "q2", "q3", "q4", "q5", "q6"],
  },
  {
    groupKey: "booking",
    questions: ["q7", "q8", "q9", "q10", "q11"],
  },
  {
    groupKey: "safety",
    questions: ["q12", "q13", "q14", "q15"],
  },
  {
    groupKey: "technical",
    questions: ["q16", "q17", "q18", "q19", "q20"],
  },
] as const;

export function FaqClient() {
  const t = useTranslations("faq");

  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <section className="relative pb-8">
        <div className="container relative z-10 mx-auto max-w-4xl px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4 text-2xl font-bold text-white sm:text-4xl lg:text-5xl"
          >
            {t("pageTitle")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto max-w-2xl text-lg text-slate-200/90"
          >
            {t("pageDescription")}
          </motion.p>
        </div>
      </section>

      {/* FAQ Accordion groups */}
      <section className="relative pb-24">
        <div className="container mx-auto max-w-3xl px-4">
          {FAQ_GROUPS.map((group, gi) => (
            <motion.div
              key={group.groupKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: gi * 0.1 }}
              className="mb-10"
            >
              <h2 className="mb-4 text-xl font-semibold text-cyan-300">
                {t(`group_${group.groupKey}`)}
              </h2>
              <div className="space-y-2">
                {group.questions.map((qKey) => (
                  <FaqItem key={qKey} qKey={qKey} />
                ))}
              </div>
            </motion.div>
          ))}

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <p className="mb-4 text-slate-300">{t("stillQuestions")}</p>
            <Link
              href="/contact"
              className="btn-ocean inline-flex items-center justify-center px-6 py-3 text-sm"
            >
              {t("contactUs")}
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function FaqItem({ qKey }: { qKey: string }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("faq");

  return (
    <div className="glass-ocean overflow-hidden rounded-xl">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/5"
      >
        <span className="pr-4 text-sm font-medium text-white">
          {t(`${qKey}_question`)}
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 text-cyan-400"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/5 px-5 pb-4 pt-3">
              <p className="text-sm leading-relaxed text-slate-300/90">
                {t(`${qKey}_answer`)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
