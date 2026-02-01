"use client";

import { cn } from "@/lib/utils";

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function MagneticButton({
  className,
  variant = "primary",
  size = "md",
  children,
  disabled,
  ...props
}: MagneticButtonProps) {
  const variants = {
    primary: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98]",
    secondary: "bg-white/15 border border-white/25 text-white/90 hover:bg-white/25 hover:scale-[1.02] active:scale-[0.98]",
    ghost: "text-white/90 hover:bg-white/15 hover:scale-[1.02] active:scale-[0.98]",
  };

  const sizes = {
    sm: "h-9 px-4 text-sm",
    md: "h-11 px-6 text-sm",
    lg: "h-14 px-8 text-base font-semibold",
  };

  return (
    <button
      className={cn(
        "relative inline-flex items-center justify-center rounded-xl transition-all",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
