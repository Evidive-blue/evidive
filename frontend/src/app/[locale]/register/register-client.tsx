"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import { authApi } from "@/lib/api";

const GOOGLE_OAUTH_ENABLED =
  process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true";

type GoogleStatus = "idle" | "loading";

export function RegisterClient(): React.JSX.Element {
  const t = useTranslations("register");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);

  async function handleGoogleRegister(): Promise<void> {
    if (!GOOGLE_OAUTH_ENABLED) return;
    setGoogleStatus("loading");
    setErrorMsg(null);
    try {
      await authApi.loginWithGoogle();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : t("error"));
      setGoogleStatus("idle");
    }
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg(null);

    const form = e.currentTarget;
    const firstName = (
      form.elements.namedItem("firstName") as HTMLInputElement
    ).value.trim();
    const lastName = (
      form.elements.namedItem("lastName") as HTMLInputElement
    ).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
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

    try {
      const user = await authApi.register({
        email,
        password,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
      });

      // If user has no id, email confirmation is needed
      if (!user.id) {
        setStatus("success");
        return;
      }

      // Auto-login after registration, then redirect to onboard
      try {
        await authApi.login({ email, password });
        router.push("/onboard/profile");
      } catch (_autoLoginErr: unknown) {
        // Auto-login after registration failed (e.g. email confirmation required).
        // Redirect to login page so the user can sign in manually.
        router.push("/login");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t("error"));
      setStatus("error");
      return;
    }
    setStatus("idle");
  }

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="text-center"
      >
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20">
          <Mail className="h-8 w-8 text-cyan-400" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold text-white">{t("checkEmail")}</h2>
        <p className="mt-2 text-sm text-slate-400">
          {t("checkEmailDescription")}
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block font-medium text-cyan-400 transition-colors hover:text-cyan-300"
        >
          {tCommon("login")}
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
      {GOOGLE_OAUTH_ENABLED && (
        <>
          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={googleStatus === "loading"}
            className="btn-ocean-outline flex w-full items-center justify-center gap-2 px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            aria-label={t("withGoogle")}
          >
            <svg
              className="h-5 w-5 shrink-0"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {t("withGoogle")}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="divider-ocean w-full" />
            </div>
            <span className="relative flex justify-center">
              <span className="bg-transparent px-3 text-xs text-slate-500 backdrop-blur-sm">
                {t("or")}
              </span>
            </span>
          </div>
        </>
      )}

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

        {/* First name / Last name grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
          <div className="space-y-2">
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-slate-300"
            >
              {t("firstName")}
            </label>
            <div className="relative">
              <User
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                aria-hidden="true"
              />
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                autoComplete="given-name"
                disabled={status === "loading"}
                className="input-ocean h-11 w-full pl-10 pr-4 text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-slate-300"
            >
              {t("lastName")}
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              autoComplete="family-name"
              disabled={status === "loading"}
              className="input-ocean h-11 w-full px-4 text-sm"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-300"
          >
            {t("email")}
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              disabled={status === "loading"}
              className="input-ocean h-11 w-full pl-10 pr-4 text-sm"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-300"
          >
            {t("password")}
          </label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              disabled={status === "loading"}
              className="input-ocean h-11 w-full pl-10 pr-4 text-sm"
            />
          </div>
        </div>

        {/* Confirm password */}
        <div className="space-y-2">
          <label
            htmlFor="confirmPassword"
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
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              disabled={status === "loading"}
              className="input-ocean h-11 w-full pl-10 pr-4 text-sm"
            />
          </div>
        </div>

        {/* Accept terms */}
        <div className="flex items-start gap-3">
          <input
            id="acceptTerms"
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            required
            disabled={status === "loading"}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-600 bg-slate-800 text-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <label
            htmlFor="acceptTerms"
            className="cursor-pointer text-sm leading-tight text-slate-400"
          >
            {t("acceptTerms")}{" "}
            <Link
              href="/terms"
              className="text-cyan-400 transition-colors hover:text-cyan-300"
              target="_blank"
            >
              {t("termsLink")}
            </Link>
          </label>
        </div>

        <button
          type="submit"
          disabled={status === "loading" || !acceptTerms}
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

      {/* Login link */}
      <p className="mt-6 text-center text-sm text-slate-400">
        {t("hasAccount")}{" "}
        <Link
          href="/login"
          className="font-medium text-cyan-400 transition-colors hover:text-cyan-300"
        >
          {tCommon("login")}
        </Link>
      </p>
    </motion.div>
  );
}
