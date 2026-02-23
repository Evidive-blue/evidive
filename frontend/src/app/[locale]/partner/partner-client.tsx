"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const benefits = [
  { key: "visibility", icon: EyeIcon, accent: "feature-card-cyan" },
  { key: "booking", icon: CalendarIcon, accent: "feature-card-teal" },
  { key: "payment", icon: ShieldIcon, accent: "feature-card-violet" },
  { key: "community", icon: GlobeIcon, accent: "feature-card-cyan" },
] as const;

const steps = ["register", "configure", "publish", "receive"] as const;

export function PartnerClient() {
  const t = useTranslations("partner");

  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <section className="relative pb-12">
        <div className="container relative z-10 mx-auto max-w-5xl px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 text-2xl font-bold text-white sm:text-4xl lg:text-5xl xl:text-6xl"
          >
            {t("heroTitle")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto mb-8 max-w-2xl text-lg text-slate-200/90 sm:text-xl"
          >
            {t("heroSubtitle")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <Link
              href="/onboard/center"
              className="btn-ocean inline-flex items-center justify-center px-8 py-4 text-base"
            >
              {t("ctaRegister")}
            </Link>
            <Link
              href="/contact"
              className="btn-ocean-outline inline-flex items-center justify-center px-8 py-4 text-base"
            >
              {t("ctaContact")}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="relative py-12 md:py-16 lg:py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent" />
        <div className="container relative mx-auto max-w-6xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-xl font-bold text-white sm:text-3xl lg:text-4xl">
              {t("benefitsTitle")}
            </h2>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b, i) => (
              <motion.div
                key={b.key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`glass-ocean ${b.accent} group relative overflow-hidden rounded-2xl p-6`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/30 to-teal-500/20 text-cyan-400 shadow-md shadow-cyan-500/10 transition-all duration-300 group-hover:scale-110">
                    <b.icon />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">
                    {t(`benefit_${b.key}`)}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-300">
                    {t(`benefit_${b.key}_desc`)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-12 md:py-16 lg:py-24">
        <div className="container mx-auto max-w-4xl px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-xl font-bold text-white sm:text-3xl lg:text-4xl">
              {t("howTitle")}
            </h2>
          </motion.div>

          <div className="space-y-6">
            {steps.map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-ocean flex items-start gap-5 rounded-2xl p-6"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 text-sm font-bold text-slate-950">
                  {i + 1}
                </div>
                <div>
                  <h3 className="mb-1 text-lg font-semibold text-white">
                    {t(`step_${step}`)}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-300">
                    {t(`step_${step}_desc`)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative py-12 md:py-16 lg:py-24">
        <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent" />
        <div className="container relative mx-auto max-w-4xl px-4">
          <div className="grid gap-6 sm:grid-cols-3">
            {(["divers", "centers", "countries"] as const).map((stat, i) => (
              <motion.div
                key={stat}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-ocean rounded-2xl p-6 text-center"
              >
                <div className="mb-2 text-2xl font-bold text-cyan-300 sm:text-3xl">
                  {t(`stat_${stat}_value`)}
                </div>
                <div className="text-sm text-slate-300">
                  {t(`stat_${stat}_label`)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative py-12 md:py-16 lg:py-24">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 text-xl font-bold text-white sm:text-2xl lg:text-3xl">
              {t("ctaTitle")}
            </h2>
            <p className="mb-8 text-lg text-slate-300">{t("ctaSubtitle")}</p>
            <Link
              href="/onboard/center"
              className="btn-ocean inline-flex items-center justify-center px-8 py-4 text-base"
            >
              {t("ctaRegister")}
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

/* ── Icons ── */
function EyeIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2" />
      <path strokeWidth="2" strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <path strokeWidth="2" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}
