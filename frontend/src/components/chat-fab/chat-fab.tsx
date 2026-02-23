"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { DiveGuideChat } from "@/components/explorer/dive-guide-chat";

/**
 * ChatFab — Floating action button that opens the DiveGuide AI
 * chatbot as a popup overlay.
 *
 * - Desktop: chat panel anchored bottom-right
 * - Mobile: near-fullscreen overlay above bottom nav
 * - Closes on Escape key
 * - Icon animates between chat bubble and close
 */
export function ChatFab(): React.JSX.Element {
  const t = useTranslations("chatFab");
  const tCommon = useTranslations("common");
  const [isOpen, setIsOpen] = useState(false);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!isOpen) {return;}
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {setIsOpen(false);}
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  return (
    <>
      {/* ── Chat popup ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop (mobile only) */}
            <motion.div
              key="chat-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              onClick={toggle}
              aria-hidden="true"
            />

            {/* Panel */}
            <motion.div
              key="chat-panel"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-3 bottom-24 top-20 z-50 md:inset-x-auto md:bottom-24 md:right-6 md:top-auto md:h-[min(70dvh,600px)] md:w-full md:max-w-md"
            >
              <div className="glass flex h-full flex-col overflow-hidden rounded-2xl shadow-2xl shadow-cyan-500/10 dark:shadow-cyan-500/5">
                {/* Close button inside panel */}
                <button
                  type="button"
                  onClick={toggle}
                  className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                  aria-label={tCommon("close")}
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>

                <DiveGuideChat />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── FAB button ── */}
      <div className="fixed bottom-20 right-4 z-40 md:bottom-6 md:right-6">
        <motion.button
          onClick={toggle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 transition-shadow hover:shadow-cyan-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          aria-label={isOpen ? tCommon("close") : t("open")}
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <X className="h-6 w-6" aria-hidden />
          ) : (
            <MessageCircle className="h-6 w-6" aria-hidden />
          )}
        </motion.button>
      </div>
    </>
  );
}
