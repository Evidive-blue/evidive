"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { updateLanguagePreference } from "@/actions/settings";

interface LanguageSelectorProps {
  currentLocale: string;
  preferredLanguage: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function LanguageSelector({
  currentLocale,
  preferredLanguage,
  onSuccess,
  onError,
}: LanguageSelectorProps) {
  const t = useTranslations("settings");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedLocale, setSelectedLocale] = useState(
    preferredLanguage || currentLocale
  );

  const handleLanguageChange = (locale: Locale) => {
    if (locale === selectedLocale || isPending) return;

    setSelectedLocale(locale);

    startTransition(async () => {
      const result = await updateLanguagePreference(locale);
      if (result.ok) {
        onSuccess?.();
        // Redirect to the same page with the new locale
        router.push(`/${locale}/settings`);
        router.refresh();
      } else {
        onError?.(result.error || "unknown_error");
        // Revert on error
        setSelectedLocale(preferredLanguage || currentLocale);
      }
    });
  };

  return (
    <div className="space-y-4">
      <label className="mb-2 block text-sm font-medium text-white/70">
        {t("language.select")}
      </label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {locales.map((locale) => (
          <button
            key={locale}
            onClick={() => handleLanguageChange(locale)}
            disabled={isPending}
            className={cn(
              "w-full rounded-xl border px-4 py-3 text-sm font-medium transition-all",
              locale === selectedLocale
                ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                : "border-white/20 text-white/70 hover:border-white/40 hover:text-white",
              isPending && "opacity-50 cursor-not-allowed"
            )}
            type="button"
          >
            {localeNames[locale]}
          </button>
        ))}
      </div>
    </div>
  );
}
