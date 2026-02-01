"use client";

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export function PasswordStrengthIndicator({
  password,
  className,
}: PasswordStrengthIndicatorProps) {
  const t = useTranslations("auth");

  const getStrength = (pwd: string): number => {
    let strength = 0;
    if (pwd.length >= 6) strength++;
    if (pwd.length >= 10) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const strength = getStrength(password);

  const getColor = (level: number): string => {
    if (strength >= level) {
      if (strength <= 2) return "bg-red-400";
      if (strength <= 3) return "bg-amber-400";
      return "bg-emerald-400";
    }
    return "bg-white/20";
  };

  const getLabel = (): string => {
    if (password.length === 0) return "";
    if (strength <= 2) return t("password_strength.weak");
    if (strength <= 3) return t("password_strength.medium");
    return t("password_strength.strong");
  };

  const getRequirements = (): { met: boolean; text: string }[] => {
    return [
      {
        met: password.length >= 8,
        text: t("password_requirements.min_length"),
      },
      {
        met: /[A-Z]/.test(password),
        text: t("password_requirements.uppercase"),
      },
      {
        met: /[0-9]/.test(password),
        text: t("password_requirements.number"),
      },
    ];
  };

  if (password.length === 0) return null;

  const requirements = getRequirements();
  const allRequirementsMet = requirements.every((req) => req.met);

  return (
    <div className={cn("mt-2 space-y-2", className)}>
      {/* Strength bars */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              getColor(level)
            )}
          />
        ))}
      </div>

      {/* Strength label */}
      <p
        className={cn(
          "text-xs font-medium",
          strength <= 2
            ? "text-red-300"
            : strength <= 3
              ? "text-amber-300"
              : "text-emerald-300"
        )}
      >
        {getLabel()}
      </p>

      {/* Requirements list */}
      {!allRequirementsMet && (
        <ul className="space-y-1 text-xs" aria-label={t("password_requirements.title")}>
          {requirements.map((req, index) => (
            <li
              key={index}
              className={cn(
                "flex items-center gap-2",
                req.met ? "text-emerald-400" : "text-slate-400"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  req.met ? "bg-emerald-400" : "bg-slate-500"
                )}
                aria-hidden="true"
              />
              <span className={req.met ? "line-through opacity-60" : ""}>
                {req.text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
