"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
}

interface StrengthCriteria {
  key: string;
  test: (password: string) => boolean;
}

const criteria: StrengthCriteria[] = [
  { key: "min_length", test: (p) => p.length >= 8 },
  { key: "uppercase", test: (p) => /[A-Z]/.test(p) },
  { key: "lowercase", test: (p) => /[a-z]/.test(p) },
  { key: "number", test: (p) => /[0-9]/.test(p) },
];

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const t = useTranslations("auth.password_strength");

  const passedCount = criteria.filter((c) => c.test(password)).length;

  const getStrengthLevel = (): { level: number; label: string; color: string } => {
    if (passedCount === 0) return { level: 0, label: t("none"), color: "bg-muted" };
    if (passedCount === 1) return { level: 1, label: t("weak"), color: "bg-red-500" };
    if (passedCount === 2) return { level: 2, label: t("fair"), color: "bg-orange-500" };
    if (passedCount === 3) return { level: 3, label: t("good"), color: "bg-yellow-500" };
    return { level: 4, label: t("strong"), color: "bg-green-500" };
  };

  const strength = getStrengthLevel();

  if (!password) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{t("label")}</span>
          <span
            className={cn(
              "font-medium",
              strength.level <= 1 && "text-red-500",
              strength.level === 2 && "text-orange-500",
              strength.level === 3 && "text-yellow-500",
              strength.level === 4 && "text-green-500"
            )}
          >
            {strength.label}
          </span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-200",
                index <= strength.level ? strength.color : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Criteria checklist */}
      <ul className="space-y-1">
        {criteria.map((criterion) => {
          const passed = criterion.test(password);
          return (
            <li
              key={criterion.key}
              className={cn(
                "flex items-center gap-2 text-xs transition-colors",
                passed ? "text-green-500" : "text-muted-foreground"
              )}
            >
              {passed ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              <span>{t(`criteria.${criterion.key}`)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
