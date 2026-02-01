"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  key: string;
  label: string;
}

interface OnboardStepperProps {
  steps: Step[];
  basePath: string;
  accentColor?: "cyan" | "emerald" | "blue";
  currentStepKey?: string;
  onStepChange?: (step: string) => void;
}

export function OnboardStepper({
  steps,
  basePath,
  accentColor = "cyan",
  currentStepKey,
  onStepChange,
}: OnboardStepperProps) {
  const pathname = usePathname();

  const currentStep =
    currentStepKey ?? pathname.split("/").pop() ?? steps[0]?.key ?? "";
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  const colors = {
    cyan: {
      completed: "border-cyan-500 bg-cyan-500 text-white",
      current: "border-cyan-500 bg-cyan-500/20 text-cyan-400",
      line: "bg-cyan-500",
      label: "text-cyan-400",
    },
    emerald: {
      completed: "border-emerald-500 bg-emerald-500 text-white",
      current: "border-emerald-500 bg-emerald-500/20 text-emerald-400",
      line: "bg-emerald-500",
      label: "text-emerald-400",
    },
    blue: {
      completed: "border-blue-500 bg-blue-500 text-white",
      current: "border-blue-500 bg-blue-500/20 text-blue-400",
      line: "bg-blue-500",
      label: "text-blue-400",
    },
  };

  const accent = colors[accentColor];

  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;

          return (
            <li key={step.key} className="relative flex flex-1 items-center">
              {/* Connector line */}
              {index > 0 && (
                <div
                  className={cn(
                    "absolute left-0 top-5 h-0.5 w-full -translate-x-1/2",
                    isCompleted || isCurrent ? accent.line : "bg-white/30"
                  )}
                />
              )}

              {/* Step indicator */}
              {onStepChange ? (
                <button
                  type="button"
                  onClick={() => onStepChange(step.key)}
                  className={cn(
                    "relative z-10 flex flex-col items-center",
                    isUpcoming && "pointer-events-none"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                      isCompleted && accent.completed,
                      isCurrent && accent.current,
                      isUpcoming && "border-white/30 bg-white/10 text-white/70"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium",
                      isCurrent ? accent.label : "text-white/70"
                    )}
                  >
                    {step.label}
                  </span>
                </button>
              ) : (
                <Link
                  href={`${basePath}/${step.key}`}
                  className={cn(
                    "relative z-10 flex flex-col items-center",
                    isUpcoming && "pointer-events-none"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                      isCompleted && accent.completed,
                      isCurrent && accent.current,
                      isUpcoming && "border-white/30 bg-white/10 text-white/70"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium",
                      isCurrent ? accent.label : "text-white/70"
                    )}
                  >
                    {step.label}
                  </span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
