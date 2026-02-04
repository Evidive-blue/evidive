"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Timer, Infinity as InfinityIcon, Pause, Play } from "lucide-react";
import { useZenStore, type TimerOption } from "@/stores";
import { useTranslations } from "@/lib/i18n/use-translations";

const TIMER_OPTIONS: TimerOption[] = [5, 10, 15, 30, null];

export function ZenTimer() {
  const t = useTranslations("zen");
  const {
    timerMinutes,
    timerSecondsLeft,
    isTimerRunning,
    setTimer,
    startTimer,
    pauseTimer,
    tickTimer,
    closeZen,
  } = useZenStore();

  const bellRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      tickTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, tickTimer]);

  useEffect(() => {
    if (timerSecondsLeft === 0 && timerMinutes !== null) {
      bellRef.current?.play().catch(() => {});
      setTimeout(() => closeZen(), 2000);
    }
  }, [timerSecondsLeft, timerMinutes, closeZen]);

  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return "∞";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleTimerSelect = (option: TimerOption) => {
    setTimer(option);
    if (!isTimerRunning) {
      startTimer();
    }
  };

  return (
    <div className="flex items-center gap-4">
      <audio ref={bellRef} src="/sounds/bell.mp3" preload="auto" />

      <Timer className="w-5 h-5 text-cyan-400/70" />

      <div className="flex items-center gap-2">
        {TIMER_OPTIONS.map((option) => (
          <motion.button
            key={option ?? "infinity"}
            onClick={() => handleTimerSelect(option)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              timerMinutes === option
                ? "bg-cyan-500/30 text-cyan-100 border border-cyan-400/50"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80"
            }`}
          >
            {option === null ? (
              <InfinityIcon className="w-4 h-4" />
            ) : (
              `${option}${t("minutes")}`
            )}
          </motion.button>
        ))}
      </div>

      <div className="flex items-center gap-3 ml-4">
        <span className="text-2xl font-light text-cyan-100 tabular-nums min-w-16 text-center">
          {formatTime(timerSecondsLeft)}
        </span>

        <motion.button
          onClick={() => (isTimerRunning ? pauseTimer() : startTimer())}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label={isTimerRunning ? t("pause") : t("play")}
        >
          {isTimerRunning ? (
            <Pause className="w-4 h-4 text-cyan-100" />
          ) : (
            <Play className="w-4 h-4 text-cyan-100" />
          )}
        </motion.button>
      </div>
    </div>
  );
}
