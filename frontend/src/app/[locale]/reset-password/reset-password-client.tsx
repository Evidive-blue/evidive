"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Loader2, ArrowLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { authApi } from "@/lib/api";

type FormStatus = "idle" | "loading" | "success" | "error";

export function ResetPasswordClient(): React.JSX.Element {
  const t = useTranslations("resetPassword");
  const tCommon = useTranslations("common");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // No token in URL means invalid link
  if (!token) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="space-y-6"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/20">
            <AlertTriangle
              className="h-7 w-7 text-amber-400"
              aria-hidden="true"
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              {t("invalidLinkTitle")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {t("invalidLinkDescription")}
            </p>
          </div>
        </div>

        <Link
          href="/forgot-password"
          className="btn-ocean flex h-11 w-full items-center justify-center gap-2 px-6 text-sm"
        >
          {t("requestNewLink")}
        </Link>

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

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg(null);

    const form = e.currentTarget;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;
    const confirmPassword = (
      form.elements.namedItem("confirmPassword") as HTMLInputElement
    ).value;

    if (password !== confirmPassword) {
      setErrorMsg(t("passwordMismatch"));
      setStatus("error");
      return;
    }

    if (password.length < 8) {
      setErrorMsg(t("passwordTooShort"));
      setStatus("error");
      return;
    }

    try {
      await authApi.resetPassword({
        token: token ?? "",
        password,
        confirm_password: confirmPassword,
      });
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
          className="btn-ocean flex h-11 w-full items-center justify-center gap-2 px-6 text-sm"
        >
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

        {/* New Password */}
        <div className="space-y-2">
          <label
            htmlFor="reset-password"
            className="block text-sm font-medium text-slate-300"
          >
            {t("newPassword")}
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              id="reset-password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              disabled={status === "loading"}
              className="input-ocean h-11 w-full pl-10 pr-4 text-sm"
            />
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label
            htmlFor="reset-confirm-password"
            className="block text-sm font-medium text-slate-300"
          >
            {t("confirmPassword")}
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              id="reset-confirm-password"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              disabled={status === "loading"}
              className="input-ocean h-11 w-full pl-10 pr-4 text-sm"
            />
          </div>
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
