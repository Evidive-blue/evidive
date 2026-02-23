"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2 } from "lucide-react";
import { authApi, isAuthenticated, sanitizeReturnUrl } from "@/lib/api";

const GOOGLE_OAUTH_ENABLED =
  process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === "true";

type GoogleStatus = "idle" | "loading";

export function LoginClient(): React.JSX.Element {
  const t = useTranslations("login");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawReturnUrl = searchParams.get("returnUrl");
  const safeReturnUrl = sanitizeReturnUrl(rawReturnUrl);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [googleStatus, setGoogleStatus] = useState<GoogleStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleGoogleLogin(): Promise<void> {
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

  useEffect(() => {
    if (isAuthenticated()) {
      router.push(safeReturnUrl);
    }
  }, [router, safeReturnUrl]);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg(null);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;

    try {
      const res = await authApi.login({ email, password });

      // Use returned auth state directly (avoids race condition with cache)
      let redirectTo: string;
      if (rawReturnUrl) {
        redirectTo = safeReturnUrl;
      } else if (!res.profileComplete) {
        redirectTo = "/onboard/profile";
      } else if (res.user.role === "admin_diver" && res.centerCount === 0) {
        redirectTo = "/onboard/center";
      } else if (res.user.role === "admin_diver") {
        redirectTo = "/admin";
      } else {
        redirectTo = "/";
      }

      router.push(redirectTo);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : t("error"));
      setStatus("error");
      return;
    }
    setStatus("idle");
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
            onClick={handleGoogleLogin}
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-300"
            >
              {t("password")}
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-cyan-400 transition-colors hover:text-cyan-300"
              tabIndex={-1}
            >
              {t("forgotPassword")}
            </Link>
          </div>
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
              autoComplete="current-password"
              disabled={status === "loading"}
              className="input-ocean h-11 w-full pl-10 pr-4 text-sm"
            />
          </div>
        </div>

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

      <p className="mt-6 text-center text-sm text-slate-400">
        {t("noAccount")}{" "}
        <Link
          href="/register"
          className="font-medium text-cyan-400 transition-colors hover:text-cyan-300"
        >
          {tCommon("register")}
        </Link>
      </p>
    </motion.div>
  );
}
