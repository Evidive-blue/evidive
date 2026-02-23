"use client";

import { motion } from "framer-motion";

/**
 * Template re-mounts on every navigation (unlike layout which persists).
 * This creates a smooth "turning head" slide effect:
 * - Content slides in from the right with a fade
 * - Ocean background stays perfectly still (it lives in layout.tsx)
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.15,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
}
