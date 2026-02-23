"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

const STORAGE_KEY = "evidive-reduced-effects";

interface ReducedEffectsContextValue {
  /** Whether animations & effects are currently reduced */
  isReduced: boolean;
  /** Toggle reduced effects on/off */
  toggle: () => void;
}

const ReducedEffectsContext = createContext<ReducedEffectsContextValue>({
  isReduced: false,
  toggle: () => undefined,
});

/**
 * Hook to access reduced effects state.
 * Returns `{ isReduced, toggle }`.
 */
export function useReducedEffects(): ReducedEffectsContextValue {
  return useContext(ReducedEffectsContext);
}

const emptySubscribe = () => () => {};

/**
 * Provider that controls animation/effects state globally.
 *
 * Behaviour:
 * 1. Effects are enabled by default on first visit
 * 2. User preference is stored in localStorage for subsequent visits
 * 3. Sets `data-effects="reduced"` on `<html>` when active
 *    (used by CSS rules to pause animations)
 * 4. OS `prefers-reduced-motion` is respected via CSS media queries only
 */
export function ReducedEffectsProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  // Detect SSR vs client
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const [isReduced, setIsReduced] = useState(() => {
    if (typeof window === "undefined") {return false;}
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {return stored === "true";}
    return false;
  });

  // Sync `data-effects` attribute on <html>
  useEffect(() => {
    if (!isClient) {return;}

    const root = document.documentElement;
    if (isReduced) {
      root.setAttribute("data-effects", "reduced");
    } else {
      root.removeAttribute("data-effects");
    }
  }, [isReduced, isClient]);

  const toggle = useCallback(() => {
    setIsReduced((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return (
    <ReducedEffectsContext value={{ isReduced, toggle }}>
      {children}
    </ReducedEffectsContext>
  );
}
