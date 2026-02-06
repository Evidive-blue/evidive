"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n/use-translations";

function VerifyEmailContent() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("no-token");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error);
          setStatus("error");
          return;
        }

        setStatus("success");
      } catch {
        setError(t("errors.generic"));
        setStatus("error");
      }
    };

    verifyEmail();
  }, [token, t]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 pb-12 pt-24">
      <motion.div
        className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {status === "loading" && (
          <>
            <Loader2 className="mx-auto h-16 w-16 animate-spin text-cyan-400" />
            <h2 className="mt-6 text-2xl font-bold text-white">{t("verifyingEmail")}</h2>
            <p className="mt-4 text-white/60">{t("pleaseWait")}</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="mx-auto h-16 w-16 text-green-400" />
            <h2 className="mt-6 text-2xl font-bold text-white">{t("emailVerified")}</h2>
            <p className="mt-4 text-white/60">{t("emailVerifiedDescription")}</p>
            <Link href="/login">
              <Button className="mt-8 h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500">
                {t("continueToLogin")}
              </Button>
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="mx-auto h-16 w-16 text-red-400" />
            <h2 className="mt-6 text-2xl font-bold text-white">{t("verificationFailed")}</h2>
            <p className="mt-4 text-white/60">{error || t("verificationFailedDescription")}</p>
            <Link href="/login">
              <Button
                variant="outline"
                className="mt-8 h-12 rounded-xl border-white/10 bg-white/5"
              >
                {t("backToLogin")}
              </Button>
            </Link>
          </>
        )}

        {status === "no-token" && (
          <>
            <AlertCircle className="mx-auto h-16 w-16 text-amber-400" />
            <h2 className="mt-6 text-2xl font-bold text-white">{t("noToken")}</h2>
            <p className="mt-4 text-white/60">{t("noTokenDescription")}</p>
            <Link href="/login">
              <Button
                variant="outline"
                className="mt-8 h-12 rounded-xl border-white/10 bg-white/5"
              >
                {t("backToLogin")}
              </Button>
            </Link>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function VerifyEmailClient() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
    </div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
