"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, RefreshCw, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { verifyEmailToken, resendVerificationEmail } from "./actions";

type VerifyState = "idle" | "verifying" | "success" | "error";

export default function VerifyEmailPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token");

  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  // Initialize state based on token presence
  const [verifyState, setVerifyState] = useState<VerifyState>(() =>
    token ? "verifying" : "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Verify token on mount if present
  useEffect(() => {
    if (!token) return;

    let isMounted = true;

    verifyEmailToken(token).then((result) => {
      if (!isMounted) return;

      if (result.success) {
        setVerifyState("success");
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login?verified=true");
        }, 3000);
      } else {
        setVerifyState("error");
        setErrorMessage(result.error || "unknown_error");
      }
    });

    return () => {
      isMounted = false;
    };
  }, [token, router]);

  const handleResend = async () => {
    if (!email) return;
    setIsResending(true);
    setResendSuccess(false);

    const result = await resendVerificationEmail(email);

    setIsResending(false);
    if (result.success) {
      setResendSuccess(true);
    }
  };

  // Token verification mode
  if (token) {
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
            {verifyState === "verifying" && (
              <>
                <motion.div
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-cyan-500/50 bg-cyan-500/20"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="h-10 w-10 text-cyan-400" />
                </motion.div>
                <h1 className="mb-4 text-2xl font-bold text-white">
                  {t("verifying_email")}
                </h1>
                <p className="text-slate-400">{t("please_wait")}</p>
              </>
            )}

            {verifyState === "success" && (
              <>
                <motion.div
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-emerald-500/50 bg-emerald-500/20"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                >
                  <CheckCircle className="h-10 w-10 text-emerald-400" />
                </motion.div>
                <h1 className="mb-4 text-2xl font-bold text-white">
                  {t("email_verified_title")}
                </h1>
                <p className="mb-6 text-slate-400">
                  {t("email_verified_desc")}
                </p>
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 font-medium text-white transition-all hover:from-cyan-400 hover:to-blue-500"
                >
                  {t("go_to_login")}
                </Link>
              </>
            )}

            {verifyState === "error" && (
              <>
                <motion.div
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-red-500/50 bg-red-500/20"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                >
                  <XCircle className="h-10 w-10 text-red-400" />
                </motion.div>
                <h1 className="mb-4 text-2xl font-bold text-white">
                  {t("verification_failed")}
                </h1>
                <p className="mb-6 text-slate-400">
                  {t(`verification_error_${errorMessage}`) || t("verification_error_unknown")}
                </p>
                <div className="flex flex-col gap-3">
                  <Link
                    href="/register"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 font-medium text-white transition-all hover:from-cyan-400 hover:to-blue-500"
                  >
                    {t("try_again")}
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 font-medium text-white transition-all hover:bg-white/10"
                  >
                    {t("go_to_login")}
                  </Link>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Email pending verification mode (no token)
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

          {resendSuccess && (
            <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3">
              <p className="text-sm text-emerald-400">{t("email_resent")}</p>
            </div>
          )}

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
