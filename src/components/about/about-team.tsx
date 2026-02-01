"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Users } from "lucide-react";

export function AboutTeam() {
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
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="h-full w-full"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>

          <div className="relative p-8 text-center sm:p-12">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30">
              <Users className="h-10 w-10 text-cyan-400" />
            </div>

            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              {t("team.title")}
            </h2>

            <p className="mx-auto max-w-2xl text-lg text-white/70">
              {t("team.description")}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
