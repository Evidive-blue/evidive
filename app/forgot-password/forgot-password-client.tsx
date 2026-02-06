"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Mail, ArrowLeft, CheckCircle, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/lib/i18n/use-translations";

export default function ForgotPasswordClient() {
  const t = useTranslations("auth");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Always show success to prevent email enumeration
      setSubmitted(true);
    } catch {
      // Still show success
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 pb-12 pt-24">
        <motion.div
          className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <CheckCircle className="mx-auto h-16 w-16 text-green-400" />
          <h2 className="mt-6 text-2xl font-bold text-white">{t("checkYourEmail")}</h2>
          <p className="mt-4 text-white/60">{t("resetLinkSent")}</p>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToLogin")}
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 pb-12 pt-24">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/20 blur-[150px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <motion.div
            className="absolute -right-6 -top-6 h-24 w-24 text-cyan-500/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Waves className="h-full w-full" />
          </motion.div>

          <Link
            href="/login"
            className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToLogin")}
          </Link>

          <div className="mb-8 text-center">
            <h1 className="mb-3 text-3xl font-bold text-white">{t("forgotPasswordTitle")}</h1>
            <p className="text-sm text-white/60">{t("forgotPasswordDescription")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("email")}
                required
                disabled={isLoading}
                className="h-14 rounded-xl border-white/10 bg-white/5 pl-12 text-white placeholder:text-white/40"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="h-14 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-lg font-semibold"
            >
              {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {t("sendResetLink")}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
