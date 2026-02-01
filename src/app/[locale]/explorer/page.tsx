"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { MapPin, Compass, Waves } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default function ExplorerPage() {
  const t = useTranslations("explorer");
  const tDestinations = useTranslations("destinations");

  return (
    <div className="min-h-screen pt-24 pb-16 relative overflow-hidden">
      {/* Background glow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <motion.div
          className="absolute top-1/3 right-1/4 h-[400px] w-[400px] rounded-full bg-cyan-500/15 blur-[120px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 h-[300px] w-[300px] rounded-full bg-blue-500/15 blur-[100px]"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="mb-4 text-5xl font-bold text-white md:text-6xl">
            {t("title")}
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-slate-400">
            {t("subtitle")}
          </p>
        </motion.div>

        {/* Coming Soon Card */}
        <motion.div
          className="mx-auto max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
            <motion.div
              className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-cyan-500/20"
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Compass className="h-12 w-12 text-cyan-400" />
            </motion.div>

            <h2 className="mb-4 text-2xl font-bold text-white">
              {t("coming_soon")}
            </h2>
            <p className="mb-8 text-slate-400">
              {t("coming_soon_desc")}
            </p>

            {/* Sample destinations preview */}
            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { name: tDestinations("maldives.name"), icon: "🏝️" },
                { name: tDestinations("bali.name"), icon: "🌴" },
                { name: tDestinations("redSea.name"), icon: "🐠" },
                { name: tDestinations("greatBarrier.region"), icon: "🦈" },
              ].map((dest, i) => (
                <motion.div
                  key={dest.name}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                >
                  <span className="mb-2 block text-2xl">{dest.icon}</span>
                  <span className="text-sm text-white">{dest.name}</span>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/">
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 sm:w-auto"
                >
                  <Waves className="mr-2 h-5 w-5" />
                  {t("backHome")}
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Floating decorations */}
        <motion.div
          className="absolute left-10 top-1/3"
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <MapPin className="h-8 w-8 text-cyan-500/30" />
        </motion.div>
        <motion.div
          className="absolute right-10 top-1/2"
          animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Compass className="h-10 w-10 text-blue-500/30" />
        </motion.div>
      </div>
    </div>
  );
}
