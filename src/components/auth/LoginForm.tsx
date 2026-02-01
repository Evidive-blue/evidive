"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useId } from "react";
import { Loader2, Waves, AlertCircle } from "lucide-react";
import { LiquidInput } from "@/components/ui/liquid-input";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { cn } from "@/lib/utils";
import { loginAction, type LoginResult } from "@/app/[locale]/login/actions";

interface LoginFormProps {
  locale: string;
}

export function LoginForm({ locale }: LoginFormProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const checkboxId = useId();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setRetryAfter(null);

    try {
      const data = new FormData();
      data.append("email", formData.email);
      data.append("password", formData.password);
      data.append("rememberMe", String(formData.rememberMe));

      const result: LoginResult = await loginAction(data, locale);

      if (result.ok && result.redirectUrl) {
        router.push(result.redirectUrl);
        router.refresh();
      } else if (result.rateLimited && result.retryAfter) {
        setRetryAfter(result.retryAfter);
        setError(t("errors.too_many_attempts"));
      } else {
        // Generic error message for security (don't reveal if email exists)
        setError(t("errors.invalid_credentials"));
      }
    } catch {
      setError(t("generic_error"));
    } finally {
      setIsLoading(false);
    }
  };

  // Format remaining time for rate limit
  const formatRetryTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes > 0) {
      return `${minutes}min ${secs}s`;
    }
    return `${secs}s`;
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden pb-12 pt-20">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/20 blur-[150px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-blue-600/30 blur-[120px]"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        className="relative z-10 mx-4 w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          {/* Decorative wave icon */}
          <motion.div
            className="absolute -right-6 -top-6 h-24 w-24 text-cyan-500/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Waves className="h-full w-full" />
          </motion.div>

          <div className="mb-10 text-center">
            <motion.h1
              className="mb-3 text-4xl font-bold text-white"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              {t("login_title")}
            </motion.h1>
            <motion.p
              className="text-sm text-white/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              {t("no_account")}{" "}
              <Link
                href="/register"
                className="font-medium text-cyan-400 transition-colors hover:text-cyan-300"
              >
                {t("sign_up_link")}
              </Link>
            </motion.p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <div className="flex flex-col">
                  <span>{error}</span>
                  {retryAfter !== null && retryAfter > 0 && (
                    <span className="text-xs text-red-300/80">
                      {t("errors.retry_after", { time: formatRetryTime(retryAfter) })}
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <LiquidInput
                type="email"
                label={t("email")}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                autoComplete="email"
                disabled={isLoading}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <LiquidInput
                type="password"
                label={t("password")}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                autoComplete="current-password"
                disabled={isLoading}
              />
            </motion.div>

            {/* Remember me & Forgot password */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex items-center justify-between"
            >
              <label
                htmlFor={checkboxId}
                className="flex cursor-pointer items-center gap-2 text-sm text-white/70"
              >
                <input
                  type="checkbox"
                  id={checkboxId}
                  checked={formData.rememberMe}
                  onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                  disabled={isLoading}
                  className={cn(
                    "h-4 w-4 rounded border-white/20 bg-white/5",
                    "text-cyan-500 focus:ring-2 focus:ring-cyan-500/40 focus:ring-offset-0",
                    "transition-colors"
                  )}
                />
                <span>{t("remember_me")}</span>
              </label>

              <Link
                href="/forgot-password"
                className="text-sm text-cyan-400/70 transition-colors hover:text-cyan-400"
              >
                {t("forgot_password")}
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="pt-4"
            >
              <MagneticButton
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isLoading || (retryAfter !== null && retryAfter > 0)}
              >
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {t("submit_login")}
              </MagneticButton>
            </motion.div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
