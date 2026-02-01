"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface LiquidInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function LiquidInput({
  className,
  label,
  error,
  type = "text",
  ...props
}: LiquidInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  return (
    <div className="relative">
      <input
        type={type}
        className={cn(
          "peer h-14 w-full rounded-xl border bg-white/5 px-4 pt-4 text-white backdrop-blur-xl transition-all",
          "placeholder-transparent",
          "focus:outline-none focus:ring-2 focus:ring-cyan-500/40",
          error
            ? "border-red-400/60 focus:border-red-400"
            : "border-white/20 focus:border-cyan-500/60",
          className
        )}
        placeholder={label}
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
          setIsFocused(false);
          setHasValue(e.target.value.length > 0);
        }}
        onChange={(e) => setHasValue(e.target.value.length > 0)}
        {...props}
      />
      <label
        className={cn(
          "pointer-events-none absolute left-4 text-white/60 transition-all duration-200",
          isFocused || hasValue || props.value
            ? "top-2 text-xs text-cyan-300"
            : "top-1/2 -translate-y-1/2 text-sm"
        )}
      >
        {label}
      </label>
      {error ? <p className="mt-1 text-xs text-red-300 font-medium">{error}</p> : null}
    </div>
  );
}
