"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { Loader2, Mail, Lock, AlertCircle, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/lib/i18n/use-translations";
import { cn } from "@/lib/utils";

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const normalizedEmail = formData.email.trim().toLowerCase();
      const result = await signIn("credentials", {
        email: normalizedEmail,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError(t("errors.invalidCredentials"));
      } else if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError(t("errors.generic"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    await signIn("google", { callbackUrl });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (error) setError(null);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 pb-8 pt-24">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-cyan-500/20 blur-[150px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-blue-600/30 blur-[120px]"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          {/* Decorative wave */}
          <motion.div
            className="absolute -right-6 -top-6 h-24 w-24 text-cyan-500/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Waves className="h-full w-full" />
          </motion.div>

          {/* Header */}
          <div className="mb-4 text-center">
            <motion.h1
              className="mb-3 text-4xl font-bold text-white"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {t("loginTitle")}
            </motion.h1>
            <motion.p
              className="text-sm text-white/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {t("noAccount")}{" "}
              <Link
                href="/register"
                className="font-medium text-cyan-400 transition-colors hover:text-cyan-300"
              >
                {t("signUpLink")}
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
                <span>{error}</span>
              </motion.div>
            )}

            {/* Email */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t("email")}
                  required
                  disabled={isLoading}
                  className="h-14 rounded-xl border-white/10 bg-white/5 pl-12 text-white placeholder:text-white/40"
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t("password")}
                  required
                  disabled={isLoading}
                  className="h-14 rounded-xl border-white/10 bg-white/5 pl-12 text-white placeholder:text-white/40"
                />
              </div>
            </motion.div>

            {/* Remember me & Forgot password */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-between"
            >
              <label className="flex cursor-pointer items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={cn(
                    "h-4 w-4 rounded border-white/20 bg-white/5",
                    "text-cyan-500 focus:ring-2 focus:ring-cyan-500/40"
                  )}
                />
                <span>{t("rememberMe")}</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-cyan-400/70 transition-colors hover:text-cyan-400"
              >
                {t("forgotPassword")}
              </Link>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="pt-4"
            >
              <Button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="h-14 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-lg font-semibold hover:from-cyan-400 hover:to-blue-400"
              >
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {t("submitLogin")}
              </Button>
            </motion.div>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="relative flex items-center py-2"
            >
              <div className="flex-grow border-t border-white/10" />
              <span className="mx-4 flex-shrink text-sm text-white/40">{t("or")}</span>
              <div className="flex-grow border-t border-white/10" />
            </motion.div>

            {/* Google Sign In */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={isLoading || isGoogleLoading}
                className="h-14 w-full rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                {isGoogleLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                {t("continueWithGoogle")}
              </Button>
            </motion.div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
