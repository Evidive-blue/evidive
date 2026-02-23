"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { authApi } from "@/lib/api";

type FormStatus = "idle" | "loading" | "success" | "error";

export function ForgotPasswordClient(): React.JSX.Element {
  const t = useTranslations("forgotPassword");
  const tCommon = useTranslations("common");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg(null);

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;

    try {
      await authApi.forgotPassword({ email });
      setStatus("success");
    } catch {
      setErrorMsg(t("error"));
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="space-y-6"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
            <CheckCircle2
              className="h-7 w-7 text-emerald-400"
              aria-hidden="true"
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              {t("successTitle")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {t("successDescription")}
            </p>
          </div>
        </div>

        <Link
          href="/login"
          className="btn-ocean-outline flex h-11 w-full items-center justify-center gap-2 px-6 text-sm"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("backToLogin")}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400"
            role="alert"
          >
            {errorMsg}
          </motion.div>
        )}

        {/* Email */}
        <div className="space-y-2">
          <label
            htmlFor="forgot-email"
            className="block text-sm font-medium text-slate-300"
          >
            {t("emailLabel")}
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              id="forgot-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              disabled={status === "loading"}
              className="input-ocean h-11 w-full pl-10 pr-4 text-sm"
            />
          </div>
          <p className="text-xs text-slate-500">{t("emailHint")}</p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={status === "loading"}
          className="btn-ocean flex h-11 w-full items-center justify-center gap-2 px-6 text-sm"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {tCommon("loading")}
            </>
          ) : (
            t("submit")
          )}
        </button>
      </form>

      {/* Back to login */}
      <p className="mt-6 text-center text-sm text-slate-400">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 font-medium text-cyan-400 transition-colors hover:text-cyan-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          {t("backToLogin")}
        </Link>
      </p>
    </motion.div>
  );
}
