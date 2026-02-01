"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { MagneticButton } from "@/components/ui/magnetic-button";

export function TokenInvalidView() {
  const t = useTranslations("auth");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden pb-16 pt-24">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute right-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-red-500/15 blur-[120px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        className="relative z-10 mx-4 w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
          <motion.div
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-500 bg-red-500/20"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <AlertCircle className="h-8 w-8 text-red-500" />
          </motion.div>
          <h1 className="mb-4 text-2xl font-bold text-white">
            {t("reset_password.invalid_title")}
          </h1>
          <p className="mb-6 text-slate-400">
            {t("reset_password.invalid_desc")}
          </p>

          <div className="space-y-3">
            <Link href="/forgot-password" className="block">
              <MagneticButton variant="primary" size="lg" className="w-full">
                {t("reset_password.request_new_link")}
              </MagneticButton>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 text-slate-400 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("back_to_login")}
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
