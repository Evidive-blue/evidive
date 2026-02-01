"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { Mail, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { LiquidInput } from "@/components/ui/liquid-input";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { requestPasswordReset } from "./actions";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const params = useParams();
  const locale = params.locale as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.append("email", email);

    await requestPasswordReset(locale, formData);

    // Always show success (prevents email enumeration)
    setIsLoading(false);
    setIsSuccess(true);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden pb-16 pt-24">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute right-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-cyan-500/15 blur-[120px]"
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
        {isSuccess ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
            <motion.div
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-green-500 bg-green-500/20"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <CheckCircle className="h-8 w-8 text-green-500" />
            </motion.div>
            <h1 className="mb-4 text-2xl font-bold text-white">
              {t("email_sent")}
            </h1>
            <p className="mb-6 text-slate-400">
              {t("email_sent_desc")}
            </p>
            <Link href="/login">
              <MagneticButton variant="primary" size="lg" className="w-full">
                {t("back_to_login")}
              </MagneticButton>
            </Link>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
            <Link
              href="/login"
              className="mb-8 inline-flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("back")}
            </Link>

            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20">
                <Mail className="h-8 w-8 text-cyan-400" />
              </div>
              <h1 className="mb-2 text-3xl font-bold text-white">
                {t("forgot_password")}
              </h1>
              <p className="text-slate-400">
                {t("reset_email_desc")}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <LiquidInput
                type="email"
                label={t("email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <MagneticButton
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isLoading || !email}
              >
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {t("send_link")}
              </MagneticButton>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              {t("remember_password")}{" "}
              <Link
                href="/login"
                className="text-cyan-400 transition-colors hover:text-cyan-300"
              >
                {t("sign_in_link")}
              </Link>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
