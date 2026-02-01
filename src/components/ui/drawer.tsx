"use client";

import { useEffect } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const springConfig = {
  type: "spring",
  stiffness: 400,
  damping: 30,
  mass: 1,
} as const;

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
}

export function Drawer({
  open,
  onOpenChange,
  children,
  className,
  overlayClassName,
  contentClassName,
  ariaLabel,
  ariaLabelledBy,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open ? (
        <div className={cn("fixed inset-0 z-50", className)}>
          <motion.div
            className={cn(
              "absolute inset-0 z-0 bg-black/50 backdrop-blur-md",
              overlayClassName
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={springConfig}
            aria-hidden="true"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            className={cn(
              "absolute left-1/2 top-1/2 z-10 flex w-[calc(100%-2rem)] max-w-lg flex-col",
              "max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-hidden",
              "rounded-3xl border border-white/15",
              "bg-gradient-to-b from-slate-900/70 to-slate-950/80",
              "backdrop-blur-2xl shadow-2xl ring-1 ring-cyan-500/20",
              contentClassName
            )}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={springConfig}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
          >
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

export function DrawerHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-white/10 p-6", className)} {...props} />;
}

export function DrawerBody({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex-1 overflow-y-auto px-6 py-6 scrollbar-none",
        className
      )}
      {...props}
    />
  );
}

export function DrawerFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("border-t border-white/10 px-6 py-4", className)} {...props} />
  );
}
