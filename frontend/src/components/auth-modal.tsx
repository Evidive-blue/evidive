"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { authApi, sanitizeReturnUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

type AuthView = "login" | "register";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultView?: AuthView;
}

export function AuthModal({
  open,
  onOpenChange,
  defaultView = "login",
}: AuthModalProps): React.JSX.Element {
  const [view, setView] = useState<AuthView>(defaultView);
  const tLogin = useTranslations("login");
  const tRegister = useTranslations("register");
  const tCommon = useTranslations("common");

  const switchToLogin = useCallback(() => setView("login"), []);
  const switchToRegister = useCallback(() => setView("register"), []);

  const handleSuccess = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        setView(defaultView);
      }
      onOpenChange(nextOpen);
    },
    [defaultView, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="glass-ocean-solid max-h-[90vh] overflow-y-auto border-none bg-transparent p-0 shadow-2xl shadow-black/60 sm:max-w-md"
        overlayClassName="bg-black/70 backdrop-blur-sm"
        showCloseButton={false}
      >
        <div className="p-6 sm:p-8">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label={tCommon("close")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>

          <div className="mb-6 flex rounded-xl bg-white/5 p-1">
            <button
              type="button"
              onClick={switchToLogin}
              className={cn(
                "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
                view === "login"
                  ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 shadow-sm"
                  : "text-slate-400 hover:text-white"
              )}
            >
              {tCommon("login")}
            </button>
            <button
              type="button"
              onClick={switchToRegister}
              className={cn(
                "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
                view === "register"
                  ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 shadow-sm"
                  : "text-slate-400 hover:text-white"
              )}
            >
              {tCommon("register")}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {view === "login" ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <DialogTitle className="text-center text-2xl font-bold text-white">
                  {tLogin("title")}
                </DialogTitle>
                <DialogDescription className="mt-1 text-center text-sm text-slate-400">
                  {tLogin("subtitle")}
                </DialogDescription>
                <div className="mt-6">
                  <ModalLoginForm
                    onSuccess={handleSuccess}
                    onSwitchToRegister={switchToRegister}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <DialogTitle className="text-center text-2xl font-bold text-white">
                  {tRegister("title")}
                </DialogTitle>
                <DialogDescription className="mt-1 text-center text-sm text-slate-400">
                  {tRegister("subtitle")}
                </DialogDescription>
                <div className="mt-6">
                  <ModalRegisterForm
                    onSuccess={handleSuccess}
                    onSwitchToLogin={switchToLogin}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ModalLoginForm({
  onSuccess,
  onSwitchToRegister,
}: {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
}): React.JSX.Element {
  const t = useTranslations("login");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawReturnUrl = searchParams.get("returnUrl");
  const safeReturnUrl = sanitizeReturnUrl(rawReturnUrl);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleGoogleLogin(): Promise<void> {
    setGoogleLoading(true);
    setErrorMsg(null);
    try {
      await authApi.loginWithGoogle();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : t("error"));
      setGoogleLoading(false);
    }
  }

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

      onSuccess();
      router.push(redirectTo);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("error");
      setErrorMsg(message);
      setStatus("error");
      return;
    }
    setStatus("idle");
  }

  return (
    <>
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading}
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
            htmlFor="modal-email"
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
              id="modal-email"
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
              htmlFor="modal-password"
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
              id="modal-password"
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
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-medium text-cyan-400 transition-colors hover:text-cyan-300"
        >
          {tCommon("register")}
        </button>
      </p>
    </>
  );
}

function ModalRegisterForm({
  onSuccess,
  onSwitchToLogin,
}: {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}): React.JSX.Element {
  const t = useTranslations("register");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);

  async function handleGoogleRegister(): Promise<void> {
    setGoogleLoading(true);
    setErrorMsg(null);
    try {
      await authApi.loginWithGoogle();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : t("error"));
      setGoogleLoading(false);
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
      await authApi.register({
        email,
        password,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
      });

      try {
        await authApi.login({ email, password });
        onSuccess();
        router.push("/onboard/profile");
      } catch (_autoLoginErr: unknown) {
        onSuccess();
        router.push("/login");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("error");
      setErrorMsg(message);
      setStatus("error");
      return;
    }
    setStatus("idle");
  }

  return (
    <>
      <button
        type="button"
        onClick={handleGoogleRegister}
        disabled={googleLoading}
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
          <div className="space-y-2">
            <label
              htmlFor="modal-firstName"
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
                id="modal-firstName"
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
              htmlFor="modal-lastName"
              className="block text-sm font-medium text-slate-300"
            >
              {t("lastName")}
            </label>
            <input
              id="modal-lastName"
              name="lastName"
              type="text"
              autoComplete="family-name"
              disabled={status === "loading"}
              className="input-ocean h-11 w-full px-4 text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="modal-reg-email"
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
              id="modal-reg-email"
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
          <label
            htmlFor="modal-reg-password"
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
              id="modal-reg-password"
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

        <div className="space-y-2">
          <label
            htmlFor="modal-reg-confirmPassword"
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
              id="modal-reg-confirmPassword"
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

        <div className="flex items-start gap-3">
          <input
            id="modal-acceptTerms"
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            required
            disabled={status === "loading"}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-600 bg-slate-800 text-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <label
            htmlFor="modal-acceptTerms"
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

      <p className="mt-6 text-center text-sm text-slate-400">
        {t("hasAccount")}{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-medium text-cyan-400 transition-colors hover:text-cyan-300"
        >
          {tCommon("login")}
        </button>
      </p>
    </>
  );
}
