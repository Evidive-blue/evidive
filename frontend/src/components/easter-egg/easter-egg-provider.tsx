"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import {
  couponApi,
  isAuthenticated,
  type CouponClaimResponse,
} from "@/lib/api";
import { Gift, X } from "lucide-react";

// ─── Types ───

interface Discovery {
  slug: string;
  discoveredAt: string;
}

interface EasterEggContextValue {
  discoveries: Discovery[];
  discover: (slug: string) => void;
}

// ─── LocalStorage key ───

const LS_KEY = "evidive_discoveries";

function readDiscoveries(): Discovery[] {
  if (typeof window === "undefined") {return [];}
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {return [];}
    return JSON.parse(raw) as Discovery[];
  } catch {
    return [];
  }
}

function persistDiscoveries(discoveries: Discovery[]): void {
  if (typeof window === "undefined") {return;}
  localStorage.setItem(LS_KEY, JSON.stringify(discoveries));
}

// ─── Context ───

const EasterEggContext = createContext<EasterEggContextValue>({
  discoveries: [],
  discover: () => undefined,
});

export function useEasterEgg(): EasterEggContextValue {
  return useContext(EasterEggContext);
}

// ─── Provider ───

export function EasterEggProvider({ children }: { children: ReactNode }): ReactNode {
  const t = useTranslations("easterEgg");
  const [discoveries, setDiscoveries] = useState<Discovery[]>(() => readDiscoveries());
  const [claimResult, setClaimResult] = useState<CouponClaimResponse | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);

  const discover = useCallback(
    (slug: string) => {
      // Prevent re-discovery of the same source within the same session
      const alreadyFound = discoveries.some((d) => d.slug === slug);
      if (alreadyFound) {return;}

      const newDiscovery: Discovery = {
        slug,
        discoveredAt: new Date().toISOString(),
      };
      const updated = [...discoveries, newDiscovery];
      setDiscoveries(updated);
      persistDiscoveries(updated);

      if (isAuthenticated()) {
        // Immediately claim via API
        couponApi
          .claim(slug)
          .then((result) => {
            setClaimResult(result);
            setShowModal(true);
          })
          .catch(() => {
            // Source may be inactive or user at limit — silently ignore
          });
      } else {
        // Guest: show prompt to create account
        setPendingSlug(slug);
        setShowGuestPrompt(true);
      }
    },
    [discoveries]
  );

  const dismissModal = useCallback(() => {
    setShowModal(false);
    setClaimResult(null);
  }, []);

  const dismissGuestPrompt = useCallback(() => {
    setShowGuestPrompt(false);
    setPendingSlug(null);
  }, []);

  const contextValue = useMemo<EasterEggContextValue>(
    () => ({ discoveries, discover }),
    [discoveries, discover]
  );

  return (
    <EasterEggContext value={contextValue}>
      {children}

      {/* Claim success modal (authenticated user) */}
      <AnimatePresence>
        {showModal && claimResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={dismissModal}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-900 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={dismissModal}
                className="absolute right-3 top-3 rounded-full p-1 text-slate-500 transition-colors hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                aria-label={t("close")}
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
                <Gift className="h-6 w-6" />
              </div>

              <h3 className="text-lg font-bold text-white">
                {t("discoveryTitle")}
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                {t("discoveryDescription", {
                  source: pendingSlug ?? claimResult.source.slug,
                })}
              </p>

              <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                <p className="text-xs text-emerald-400">{t("yourCode")}</p>
                <p className="mt-0.5 font-mono text-lg font-bold tracking-wider text-emerald-300">
                  {claimResult.coupon.code}
                </p>
              </div>

              <button
                type="button"
                onClick={dismissModal}
                className="mt-4 w-full rounded-lg bg-cyan-600 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-500"
              >
                {t("gotIt")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guest prompt (not authenticated) */}
      <AnimatePresence>
        {showGuestPrompt && pendingSlug && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={dismissGuestPrompt}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-amber-500/20 bg-slate-900 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={dismissGuestPrompt}
                className="absolute right-3 top-3 rounded-full p-1 text-slate-500 transition-colors hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                aria-label={t("close")}
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
                <Gift className="h-6 w-6" />
              </div>

              <h3 className="text-lg font-bold text-white">
                {t("guestDiscoveryTitle")}
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                {t("guestDiscoveryDescription")}
              </p>

              <p className="mt-3 text-xs text-slate-500">
                {t("guestSaved")}
              </p>

              <button
                type="button"
                onClick={dismissGuestPrompt}
                className="mt-4 w-full rounded-lg bg-amber-600 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-500"
              >
                {t("understood")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </EasterEggContext>
  );
}
