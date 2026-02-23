"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { couponApi, isAuthenticated, type CouponSourceResponse } from "@/lib/api";
import { X, Gift } from "lucide-react";

const LS_KEY = "evidive_welcome_seen";
const DELAY_MS = 20_000;

export function WelcomePopup(): React.ReactNode {
  const t = useTranslations("welcome");
  const [visible, setVisible] = useState(false);
  const [source, setSource] = useState<CouponSourceResponse | null>(null);
  const [claimedCode, setClaimedCode] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {return;}
    if (localStorage.getItem(LS_KEY)) {return;}

    const timer = setTimeout(() => {
      couponApi
        .getActiveSources()
        .then((sources) => {
          const welcomeSource = sources.find((s) => s.slug === "welcome");
          if (welcomeSource) {
            setSource(welcomeSource);
            setVisible(true);
          }
        })
        .catch(() => {
          // Silently fail — popup is non-critical
        });
    }, DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_KEY, "1");
    }
  }, []);

  const handleClaim = useCallback(async () => {
    if (!isAuthenticated()) {
      // Store that they want the welcome code, then redirect to register
      dismiss();
      return;
    }

    setClaiming(true);
    try {
      const result = await couponApi.claim("welcome");
      setClaimedCode(result.coupon.code);
      if (typeof window !== "undefined") {
        localStorage.setItem(LS_KEY, "1");
      }
    } catch {
      // Silently fail — user may already have a welcome code
      dismiss();
    } finally {
      setClaiming(false);
    }
  }, [dismiss]);

  if (!source) {return null;}

  const discountValue = source.discount_value ?? 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-sm md:bottom-8 md:left-auto md:right-8 md:inset-x-auto"
        >
          <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-900/95 p-5 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl dark:border-cyan-500/20 dark:bg-slate-900/95">
            <button
              type="button"
              onClick={dismiss}
              className="absolute right-3 top-3 rounded-full p-1 text-slate-500 transition-colors hover:bg-white/10 hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
              aria-label={t("close")}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
                <Gift className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white dark:text-slate-100">
                  {t("title")}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-400 dark:text-slate-400">
                  {t("description", { percent: discountValue })}
                </p>

                {claimedCode ? (
                  <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
                    <p className="text-xs text-emerald-400">{t("yourCode")}</p>
                    <p className="mt-0.5 font-mono text-sm font-bold tracking-wider text-emerald-300">
                      {claimedCode}
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 flex gap-2">
                    {isAuthenticated() ? (
                      <button
                        type="button"
                        onClick={handleClaim}
                        disabled={claiming}
                        className="rounded-lg bg-cyan-600 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-cyan-500 disabled:opacity-50"
                      >
                        {claiming ? t("claiming") : t("claimCode")}
                      </button>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        {t("createAccountToUnlock")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
