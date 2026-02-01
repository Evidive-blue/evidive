"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export function StepProgressBar({
  currentStep,
  totalSteps,
  stepLabels,
}: StepProgressBarProps) {
  return (
    <div className="w-full">
      {/* Progress bar */}
      <div className="relative mb-8">
        {/* Background line */}
        <div className="absolute left-0 top-5 h-0.5 w-full bg-white/20" />

        {/* Progress line */}
        <div
          className="absolute left-0 top-5 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
          style={{
            width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
          }}
        />

        {/* Step indicators */}
        <div className="relative flex justify-between">
          {stepLabels.map((label, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;
            const isUpcoming = stepNumber > currentStep;

            return (
              <div
                key={stepNumber}
                className="flex flex-col items-center"
              >
                {/* Circle */}
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                    isCompleted &&
                      "border-cyan-500 bg-cyan-500 text-white",
                    isCurrent &&
                      "border-cyan-500 bg-cyan-500/20 text-cyan-400 ring-4 ring-cyan-500/20",
                    isUpcoming &&
                      "border-white/30 bg-white/5 text-white/50"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-bold">{stepNumber}</span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "mt-3 text-xs font-medium text-center max-w-[80px] transition-colors duration-300",
                    isCurrent && "text-cyan-400",
                    isCompleted && "text-white/80",
                    isUpcoming && "text-white/40"
                  )}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step counter */}
      <div className="text-center">
        <span className="text-sm text-white/60">
          Étape {currentStep} sur {totalSteps}
        </span>
      </div>
    </div>
  );
}
