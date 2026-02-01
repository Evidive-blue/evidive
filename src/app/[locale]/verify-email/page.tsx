"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, RefreshCw } from "lucide-react";
import { useState } from "react";

export default function VerifyEmailPage() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    if (!email) return;
    setIsResending(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsResending(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden pb-16 pt-24">
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute left-1/3 top-1/3 h-[400px] w-[400px] rounded-full bg-cyan-500/15 blur-[120px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        className="relative z-10 mx-4 w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
          <Link
            href="/login"
            className="mb-8 inline-flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("back_to_login")}
          </Link>

          <motion.div
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-cyan-500/50 bg-cyan-500/20"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Mail className="h-10 w-10 text-cyan-400" />
          </motion.div>

          <h1 className="mb-4 text-3xl font-bold text-white">
            {t("verify_email_title")}
          </h1>

          <p className="mb-2 text-slate-400">
            {t("verify_email_sent")}
          </p>
          <p className="mb-6 font-medium text-cyan-400">
            {email || t("your_email")}
          </p>

          <div className="mb-6 rounded-xl bg-white/5 p-4 text-left">
            <p className="mb-3 text-sm text-slate-300">
              📧 {t("verify_email_inbox")}
            </p>
            <p className="mb-3 text-sm text-slate-300">
              📁 {t("verify_email_spam")}
            </p>
            <p className="text-sm text-slate-300">
              ⏱️ {t("verify_email_expires")}
            </p>
          </div>

          <button
            onClick={handleResend}
            disabled={isResending || !email}
            className="mb-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 font-medium text-white transition-all hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isResending ? "animate-spin" : ""}`} />
            {isResending ? t("resending") : t("resend_email")}
          </button>

          <p className="text-sm text-slate-500">
            {t("wrong_email")}{" "}
            <Link href="/register" className="text-cyan-400 hover:underline">
              {t("modify")}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
