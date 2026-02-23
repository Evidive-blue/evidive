"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { useTranslations } from "next-intl";

const SCROLL_THRESHOLD = 400;

/**
 * ScrollToTop — Fixed floating button (right side) that appears after
 * scrolling down and smoothly scrolls back to the top of the page.
 *
 * - Appears when user scrolls past SCROLL_THRESHOLD px
 * - Positioned above the ChatFab on the right side
 */
export function ScrollToTop(): React.JSX.Element {
  const t = useTranslations("scrollToTop");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = (): void => {
      setIsVisible(window.scrollY > SCROLL_THRESHOLD);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Check initial state
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed bottom-36 right-4 z-40 md:bottom-22 md:right-6">
          <motion.button
            key="scroll-to-top"
            initial={{ opacity: 0, scale: 0.8, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={scrollToTop}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white shadow-lg shadow-black/20 backdrop-blur-md transition-shadow hover:bg-white/25 hover:shadow-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent dark:bg-white/10 dark:hover:bg-white/20"
            aria-label={t("label")}
            title={t("label")}
          >
            <ArrowUp className="h-5 w-5" aria-hidden="true" />
          </motion.button>
        </div>
      )}
    </AnimatePresence>
  );
}
