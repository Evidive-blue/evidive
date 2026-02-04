import { create } from "zustand";

export type BreathingPhase = "inhale" | "hold" | "exhale";
export type TimerOption = 5 | 10 | 15 | 30 | null;

interface SoundVolumes {
  waves: number;
  bubbles: number;
  underwater: number;
}

interface ZenState {
  isOpen: boolean;
  timerMinutes: TimerOption;
  timerSecondsLeft: number | null;
  isTimerRunning: boolean;
  volumes: SoundVolumes;
  breathingPhase: BreathingPhase;
  isMuted: boolean;
}

interface ZenActions {
  openZen: () => void;
  closeZen: () => void;
  setTimer: (minutes: TimerOption) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  tickTimer: () => void;
  setVolume: (sound: keyof SoundVolumes, level: number) => void;
  setBreathingPhase: (phase: BreathingPhase) => void;
  toggleMute: () => void;
  reset: () => void;
}

const initialState: ZenState = {
  isOpen: false,
  timerMinutes: 5,
  timerSecondsLeft: null,
  isTimerRunning: false,
  volumes: {
    waves: 0.5,
    bubbles: 0.3,
    underwater: 0.4,
  },
  breathingPhase: "inhale",
  isMuted: false,
};

export const useZenStore = create<ZenState & ZenActions>((set, get) => ({
  ...initialState,

  openZen: () => {
    const { timerMinutes } = get();
    set({
      isOpen: true,
      timerSecondsLeft: timerMinutes ? timerMinutes * 60 : null,
      isTimerRunning: true,
      breathingPhase: "inhale",
    });
  },

  closeZen: () => {
    set({
      isOpen: false,
      isTimerRunning: false,
    });
  },

  setTimer: (minutes) => {
    set({
      timerMinutes: minutes,
      timerSecondsLeft: minutes ? minutes * 60 : null,
    });
  },

  startTimer: () => {
    set({ isTimerRunning: true });
  },

  pauseTimer: () => {
    set({ isTimerRunning: false });
  },

  tickTimer: () => {
    const { timerSecondsLeft, isTimerRunning } = get();
    if (!isTimerRunning || timerSecondsLeft === null) return;

    if (timerSecondsLeft <= 1) {
      set({ timerSecondsLeft: 0, isTimerRunning: false });
    } else {
      set({ timerSecondsLeft: timerSecondsLeft - 1 });
    }
  },

  setVolume: (sound, level) => {
    set((state) => ({
      volumes: {
        ...state.volumes,
        [sound]: Math.max(0, Math.min(1, level)),
      },
    }));
  },

  setBreathingPhase: (phase) => {
    set({ breathingPhase: phase });
  },

  toggleMute: () => {
    set((state) => ({ isMuted: !state.isMuted }));
  },

  reset: () => {
    set(initialState);
  },
}));
