"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  ChevronUp, 
  ChevronDown, 
  Waves, 
  Droplets, 
  Fish,
  Maximize2,
  Play,
  Pause
} from "lucide-react";
import { useZenStore } from "@/stores";
import { useTranslations } from "@/lib/i18n/use-translations";

type SoundKey = "waves" | "bubbles" | "underwater";

const SOUND_CONFIG: Record<SoundKey, { icon: React.ReactNode; color: string }> = {
  waves: { icon: <Waves className="h-4 w-4" />, color: "text-cyan-400" },
  bubbles: { icon: <Droplets className="h-4 w-4" />, color: "text-blue-400" },
  underwater: { icon: <Fish className="h-4 w-4" />, color: "text-emerald-400" },
};

const SOUND_KEYS: SoundKey[] = ["waves", "bubbles", "underwater"];

export function AmbientSoundPlayer() {
  const t = useTranslations("zen");
  const { 
    isSoundOnly, 
    volumes, 
    isMuted, 
    setVolume, 
    toggleMute, 
    disableSoundOnly, 
    openZen 
  } = useZenStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSound, setActiveSound] = useState<SoundKey>("waves");

  // Cycle through sounds
  const cycleSound = useCallback(() => {
    const currentIndex = SOUND_KEYS.indexOf(activeSound);
    const nextIndex = (currentIndex + 1) % SOUND_KEYS.length;
    setActiveSound(SOUND_KEYS[nextIndex]);
  }, [activeSound]);

  // Handle volume change for active sound
  const handleVolumeChange = useCallback((value: number) => {
    setVolume(activeSound, value);
  }, [activeSound, setVolume]);

  if (!isSoundOnly) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -20, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -20, scale: 0.9 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="fixed bottom-6 left-6 z-40"
      >
        <div className="flex flex-col items-start gap-2">
          {/* Expanded mixer panel */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="rounded-2xl bg-black/80 backdrop-blur-xl p-4 shadow-2xl shadow-cyan-500/10 border border-white/10"
              >
                <p className="text-xs text-white/50 mb-3 font-medium uppercase tracking-wider">
                  {t("soundMixer")}
                </p>
                
                <div className="flex flex-col gap-4">
                  {SOUND_KEYS.map((key) => (
                    <div key={key} className="flex items-center gap-3">
                      <button
                        onClick={() => setActiveSound(key)}
                        className={`p-2 rounded-lg transition-colors ${
                          activeSound === key 
                            ? "bg-cyan-500/20 " + SOUND_CONFIG[key].color
                            : "bg-white/5 text-white/40 hover:text-white/60"
                        }`}
                        title={t(key)}
                      >
                        {SOUND_CONFIG[key].icon}
                      </button>
                      
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={volumes[key]}
                          onChange={(e) => setVolume(key, parseFloat(e.target.value))}
                          className="flex-1 h-1.5 appearance-none bg-white/10 rounded-full cursor-pointer
                            [&::-webkit-slider-thumb]:appearance-none
                            [&::-webkit-slider-thumb]:w-3
                            [&::-webkit-slider-thumb]:h-3
                            [&::-webkit-slider-thumb]:rounded-full
                            [&::-webkit-slider-thumb]:bg-cyan-400
                            [&::-webkit-slider-thumb]:cursor-pointer
                            [&::-webkit-slider-thumb]:shadow-lg
                            [&::-webkit-slider-thumb]:shadow-cyan-400/30
                            [&::-moz-range-thumb]:w-3
                            [&::-moz-range-thumb]:h-3
                            [&::-moz-range-thumb]:rounded-full
                            [&::-moz-range-thumb]:bg-cyan-400
                            [&::-moz-range-thumb]:border-0"
                          aria-label={t(key)}
                        />
                        <span className="text-xs text-white/40 w-8 text-right">
                          {Math.round(volumes[key] * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Full zen mode button */}
                <button
                  onClick={() => {
                    disableSoundOnly();
                    openZen();
                  }}
                  className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-4 py-2.5 text-sm text-cyan-100 hover:from-cyan-500/30 hover:to-blue-500/30 transition-all border border-cyan-500/20"
                >
                  <Maximize2 className="h-4 w-4" />
                  {t("fullZenMode")}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Compact mini player bar */}
          <motion.div
            layout
            className="flex items-center gap-2 rounded-2xl bg-black/70 backdrop-blur-xl px-3 py-2 shadow-xl shadow-cyan-500/10 border border-white/10"
          >
            {/* Sound type selector */}
            <button
              onClick={cycleSound}
              className={`p-2 rounded-xl transition-all ${SOUND_CONFIG[activeSound].color} bg-white/5 hover:bg-white/10`}
              title={t(activeSound)}
            >
              {SOUND_CONFIG[activeSound].icon}
            </button>

            {/* Volume slider (compact) */}
            <div className="w-20 hidden sm:block">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volumes[activeSound]}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full h-1 appearance-none bg-white/20 rounded-full cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-2.5
                  [&::-webkit-slider-thumb]:h-2.5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-cyan-400
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-moz-range-thumb]:w-2.5
                  [&::-moz-range-thumb]:h-2.5
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-cyan-400
                  [&::-moz-range-thumb]:border-0"
                aria-label={t("volume")}
              />
            </div>

            {/* Play/Pause (mute toggle) */}
            <button
              onClick={toggleMute}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              aria-label={isMuted ? t("unmute") : t("mute")}
            >
              {isMuted ? (
                <Play className="h-4 w-4 text-white/60" />
              ) : (
                <Pause className="h-4 w-4 text-cyan-400" />
              )}
            </button>

            {/* Sound waves indicator */}
            <div className="flex items-end gap-0.5 px-1">
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-0.5 rounded-full bg-cyan-400"
                  animate={isMuted ? { height: 3, opacity: 0.3 } : {
                    height: [3, 8 + i * 2, 5, 10 + i, 3],
                    opacity: [0.4, 1, 0.6, 0.9, 0.4],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>

            {/* Expand mixer button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              aria-label={isExpanded ? t("collapse") : t("expand")}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-white/60" />
              ) : (
                <ChevronUp className="h-4 w-4 text-white/60" />
              )}
            </button>

            {/* Close button */}
            <button
              onClick={disableSoundOnly}
              className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition-colors text-white/40"
              aria-label={t("close")}
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
