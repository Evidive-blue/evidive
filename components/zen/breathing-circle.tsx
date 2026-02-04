"use client";

import { useEffect, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useZenStore } from "@/stores";
import { useTranslations } from "@/lib/i18n/use-translations";

const INHALE_DURATION = 4;
const HOLD_DURATION = 4;
const EXHALE_DURATION = 4;
const TOTAL_CYCLE = INHALE_DURATION + HOLD_DURATION + EXHALE_DURATION;

export function BreathingCircle() {
  const t = useTranslations("zen");
  const prefersReducedMotion = useReducedMotion();
  const { breathingPhase, setBreathingPhase, isOpen, isTimerRunning } = useZenStore();

  const cycleBreathing = useCallback(() => {
    if (!isOpen || !isTimerRunning) return;

    const now = Date.now();
    const cyclePosition = (now / 1000) % TOTAL_CYCLE;

    if (cyclePosition < INHALE_DURATION) {
      setBreathingPhase("inhale");
    } else if (cyclePosition < INHALE_DURATION + HOLD_DURATION) {
      setBreathingPhase("hold");
    } else {
      setBreathingPhase("exhale");
    }
  }, [isOpen, isTimerRunning, setBreathingPhase]);

  useEffect(() => {
    if (!isOpen || !isTimerRunning) return;

    const interval = setInterval(cycleBreathing, 100);
    return () => clearInterval(interval);
  }, [isOpen, isTimerRunning, cycleBreathing]);

  const getPhaseLabel = () => {
    switch (breathingPhase) {
      case "inhale":
        return t("inhale");
      case "hold":
        return t("hold");
      case "exhale":
        return t("exhale");
    }
  };

  const getCircleScale = () => {
    if (prefersReducedMotion) return 1;
    switch (breathingPhase) {
      case "inhale":
        return 1.4;
      case "hold":
        return 1.4;
      case "exhale":
        return 1;
    }
  };

  const getTransitionDuration = () => {
    switch (breathingPhase) {
      case "inhale":
        return INHALE_DURATION;
      case "hold":
        return 0.1;
      case "exhale":
        return EXHALE_DURATION;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <motion.div
        className="relative flex items-center justify-center"
        animate={{ scale: getCircleScale() }}
        transition={{
          duration: getTransitionDuration(),
          ease: breathingPhase === "hold" ? "linear" : "easeInOut",
        }}
      >
        <div className="absolute w-48 h-48 rounded-full bg-cyan-500/10 blur-xl" />
        <div className="absolute w-40 h-40 rounded-full bg-cyan-400/20 blur-lg" />
        <motion.div
          className="relative w-32 h-32 rounded-full border-2 border-cyan-400/50 bg-cyan-500/10 backdrop-blur-sm flex items-center justify-center"
          animate={{
            boxShadow:
              breathingPhase === "hold"
                ? "0 0 40px rgba(6, 182, 212, 0.4), inset 0 0 20px rgba(6, 182, 212, 0.2)"
                : "0 0 20px rgba(6, 182, 212, 0.2), inset 0 0 10px rgba(6, 182, 212, 0.1)",
          }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-4 h-4 rounded-full bg-cyan-400"
            animate={{
              scale: breathingPhase === "hold" ? [1, 1.2, 1] : 1,
            }}
            transition={{
              duration: 1,
              repeat: breathingPhase === "hold" ? Infinity : 0,
            }}
          />
        </motion.div>
      </motion.div>

      <motion.p
        key={breathingPhase}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-light text-cyan-100 tracking-widest uppercase"
      >
        {getPhaseLabel()}
      </motion.p>
    </div>
  );
}
