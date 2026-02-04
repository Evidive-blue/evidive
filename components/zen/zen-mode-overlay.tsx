"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useZenStore } from "@/stores";
import { useTranslations } from "@/lib/i18n/use-translations";
import { BreathingCircle } from "./breathing-circle";
import { ZenTimer } from "./zen-timer";
import { SoundMixer } from "./sound-mixer";

export function ZenModeOverlay() {
  const t = useTranslations("zen");
  const { isOpen, closeZen } = useZenStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeZen();
      }
    },
    [isOpen, closeZen]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="fixed inset-0 z-9999 flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label={t("zenMode")}
        >
          <div className="absolute inset-0 bg-linear-to-b from-cyan-950 via-blue-950 to-slate-950" />

          <motion.div
            className="absolute inset-0 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1.5 }}
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-cyan-400/30"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </motion.div>

          <motion.div
            className="absolute top-0 left-0 right-0 h-32 bg-linear-to-b from-cyan-500/10 to-transparent"
            animate={{
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.button
            onClick={closeZen}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
            aria-label={t("close")}
          >
            <X className="w-6 h-6 text-white/80" />
          </motion.button>

          <div className="relative flex-1 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 1 }}
            >
              <BreathingCircle />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="relative z-10 p-6 bg-linear-to-t from-slate-950/80 to-transparent"
          >
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
              <SoundMixer />
              <ZenTimer />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
