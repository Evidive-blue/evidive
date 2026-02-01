"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { KeyRound, ArrowLeft, CheckCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { LiquidInput } from "@/components/ui/liquid-input";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { PasswordStrength } from "@/components/ui/password-strength";
import { resetPassword } from "./actions";

interface ResetPasswordFormProps {
  token: string;
  email: string;
}

export function ResetPasswordForm({ token, email }: ResetPasswordFormProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordsDontMatch = confirmPassword && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("password", password);
    formData.set("confirmPassword", confirmPassword);

    const result = await resetPassword(token, formData);

    setIsLoading(false);

    if (result.success) {
      setIsSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login?reset=success");
      }, 3000);
    } else {
      if (result.error === "token_expired") {
        setError(t("reset_password.token_expired"));
      } else if (result.error === "token_invalid") {
        setError(t("reset_password.token_invalid"));
      } else {
        setError(result.error || t("generic_error"));
      }
    }
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
              {t("reset_password.success_title")}
            </h1>
            <p className="mb-6 text-slate-400">
              {t("reset_password.success_desc")}
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
                <KeyRound className="h-8 w-8 text-cyan-400" />
              </div>
              <h1 className="mb-2 text-3xl font-bold text-white">
                {t("reset_password.title")}
              </h1>
              <p className="text-slate-400">
                {t("reset_password.description")}
              </p>
              <p className="mt-2 text-sm text-cyan-400">
                {email}
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-center text-sm text-red-400"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <LiquidInput
                  type={showPassword ? "text" : "password"}
                  label={t("reset_password.new_password")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {password && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <PasswordStrength password={password} />
                </motion.div>
              )}

              <div className="relative">
                <LiquidInput
                  type={showConfirmPassword ? "text" : "password"}
                  label={t("confirm_password")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {passwordsMatch && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-green-500"
                >
                  {t("password_match")}
                </motion.p>
              )}

              {passwordsDontMatch && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-red-400"
                >
                  {t("password_mismatch")}
                </motion.p>
              )}

              <MagneticButton
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isLoading || !password || !confirmPassword || !passwordsMatch}
              >
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                {t("reset_password.submit")}
              </MagneticButton>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
}
