"use client";

import { MotionConfig } from "framer-motion";
import { useReducedEffects } from "@/components/reduced-effects-provider";

/**
 * Wraps app in MotionConfig to respect reduced motion.
 *
 * - `"user"` : respects OS `prefers-reduced-motion` (default)
 * - `"always"`: forces all Framer Motion animations off (user toggle)
 *
 * @see https://motion.dev/docs/react-accessibility
 */
export function MotionProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const { isReduced } = useReducedEffects();

  return (
    <MotionConfig reducedMotion={isReduced ? "always" : "user"}>
      {children}
    </MotionConfig>
  );
}
