"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX, Waves, Droplets, Fish } from "lucide-react";
import { useZenStore } from "@/stores";
import { useTranslations } from "@/lib/i18n/use-translations";

type SoundKey = "waves" | "bubbles" | "underwater";

interface SoundConfig {
  key: SoundKey;
  src: string;
  icon: React.ReactNode;
  labelKey: string;
}

const SOUNDS: SoundConfig[] = [
  { key: "waves", src: "/sounds/waves.mp3", icon: <Waves className="w-4 h-4" />, labelKey: "waves" },
  { key: "bubbles", src: "/sounds/bubbles.mp3", icon: <Droplets className="w-4 h-4" />, labelKey: "bubbles" },
  { key: "underwater", src: "/sounds/underwater.mp3", icon: <Fish className="w-4 h-4" />, labelKey: "underwater" },
];

export function SoundMixer() {
  const t = useTranslations("zen");
  const { volumes, isMuted, isOpen, setVolume, toggleMute } = useZenStore();

  const audioRefs = useRef<Record<SoundKey, HTMLAudioElement | null>>({
    waves: null,
    bubbles: null,
    underwater: null,
  });

  const initAudio = useCallback(() => {
    SOUNDS.forEach(({ key, src }) => {
      if (!audioRefs.current[key]) {
        const audio = new Audio(src);
        audio.loop = true;
        audio.volume = volumes[key];
        audioRefs.current[key] = audio;
      }
    });
  }, [volumes]);

  useEffect(() => {
    initAudio();
    const refs = audioRefs.current;

    return () => {
      Object.values(refs).forEach((audio) => {
        if (audio) {
          audio.pause();
          audio.src = "";
        }
      });
    };
  }, [initAudio]);

  useEffect(() => {
    Object.entries(audioRefs.current).forEach(([key, audio]) => {
      if (audio) {
        audio.volume = isMuted ? 0 : volumes[key as SoundKey];
      }
    });
  }, [volumes, isMuted]);

  useEffect(() => {
    if (isOpen) {
      Object.values(audioRefs.current).forEach((audio) => {
        audio?.play().catch(() => {});
      });
    } else {
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
    }
  }, [isOpen]);

  const handleVolumeChange = (key: SoundKey, value: number) => {
    setVolume(key, value);
  };

  return (
    <div className="flex items-center gap-6">
      <motion.button
        onClick={toggleMute}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        aria-label={isMuted ? t("unmute") : t("mute")}
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5 text-cyan-100" />
        ) : (
          <Volume2 className="w-5 h-5 text-cyan-100" />
        )}
      </motion.button>

      <div className="flex items-center gap-4">
        {SOUNDS.map(({ key, icon, labelKey }) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-cyan-400/70" title={t(labelKey)}>
              {icon}
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volumes[key]}
              onChange={(e) => handleVolumeChange(key, parseFloat(e.target.value))}
              className="w-20 h-1 appearance-none bg-white/20 rounded-full cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-3
                [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-cyan-400
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:hover:scale-125
                [&::-moz-range-thumb]:w-3
                [&::-moz-range-thumb]:h-3
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-cyan-400
                [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:cursor-pointer"
              aria-label={t(labelKey)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
