"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const LANGUAGES = [
  { code: "fr", label: "FR", flag: "🇫🇷" },
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "de", label: "DE", flag: "🇩🇪" },
  { code: "es", label: "ES", flag: "🇪🇸" },
  { code: "it", label: "IT", flag: "🇮🇹" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];
export type MultilingualValue = Partial<Record<LanguageCode, string>>;

interface MultilingualInputProps {
  value: MultilingualValue;
  onChange: (value: MultilingualValue) => void;
  placeholder?: string | Record<LanguageCode, string>;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  error?: string | Record<LanguageCode, string>;
  required?: LanguageCode[];
  label?: string;
}

export function MultilingualInput({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  inputClassName,
  error,
  required = ["fr", "en"],
  label,
}: MultilingualInputProps) {
  const [activeTab, setActiveTab] = React.useState<LanguageCode>("fr");

  const getPlaceholder = (lang: LanguageCode): string => {
    if (typeof placeholder === "string") return placeholder;
    return placeholder?.[lang] || "";
  };

  const getError = (lang: LanguageCode): string | undefined => {
    if (typeof error === "string") return activeTab === lang ? error : undefined;
    return error?.[lang];
  };

  const handleChange = (lang: LanguageCode, newValue: string) => {
    onChange({
      ...value,
      [lang]: newValue,
    });
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium text-white/90">{label}</label>
      )}
      
      {/* Language Tabs */}
      <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
        {LANGUAGES.map((lang) => {
          const hasValue = !!value[lang.code]?.trim();
          const isRequired = required.includes(lang.code);
          const hasError = !!getError(lang.code);
          
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setActiveTab(lang.code)}
              disabled={disabled}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                activeTab === lang.code
                  ? "bg-cyan-500/20 text-cyan-300"
                  : "text-white/60 hover:bg-white/5 hover:text-white/80",
                hasError && "ring-1 ring-red-500/50",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
              {isRequired && !hasValue && (
                <span className="text-red-400">*</span>
              )}
              {hasValue && (
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Input */}
      <div className="relative">
        <Input
          value={value[activeTab] || ""}
          onChange={(e) => handleChange(activeTab, e.target.value)}
          placeholder={getPlaceholder(activeTab)}
          disabled={disabled}
          className={cn(
            "border-white/10 bg-white/5 text-white placeholder:text-white/40",
            "focus:border-cyan-500/50 focus:ring-cyan-500/20",
            getError(activeTab) && "border-red-500/50 focus:border-red-500/50",
            inputClassName
          )}
        />
        {getError(activeTab) && (
          <p className="mt-1 text-xs text-red-400">{getError(activeTab)}</p>
        )}
      </div>
    </div>
  );
}

interface MultilingualTextareaProps {
  value: MultilingualValue;
  onChange: (value: MultilingualValue) => void;
  placeholder?: string | Record<LanguageCode, string>;
  disabled?: boolean;
  className?: string;
  textareaClassName?: string;
  error?: string | Record<LanguageCode, string>;
  required?: LanguageCode[];
  label?: string;
  rows?: number;
}

export function MultilingualTextarea({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  textareaClassName,
  error,
  required = ["fr", "en"],
  label,
  rows = 4,
}: MultilingualTextareaProps) {
  const [activeTab, setActiveTab] = React.useState<LanguageCode>("fr");

  const getPlaceholder = (lang: LanguageCode): string => {
    if (typeof placeholder === "string") return placeholder;
    return placeholder?.[lang] || "";
  };

  const getError = (lang: LanguageCode): string | undefined => {
    if (typeof error === "string") return activeTab === lang ? error : undefined;
    return error?.[lang];
  };

  const handleChange = (lang: LanguageCode, newValue: string) => {
    onChange({
      ...value,
      [lang]: newValue,
    });
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium text-white/90">{label}</label>
      )}
      
      {/* Language Tabs */}
      <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
        {LANGUAGES.map((lang) => {
          const hasValue = !!value[lang.code]?.trim();
          const isRequired = required.includes(lang.code);
          const hasError = !!getError(lang.code);
          
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setActiveTab(lang.code)}
              disabled={disabled}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                activeTab === lang.code
                  ? "bg-cyan-500/20 text-cyan-300"
                  : "text-white/60 hover:bg-white/5 hover:text-white/80",
                hasError && "ring-1 ring-red-500/50",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
              {isRequired && !hasValue && (
                <span className="text-red-400">*</span>
              )}
              {hasValue && (
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Textarea */}
      <div className="relative">
        <textarea
          value={value[activeTab] || ""}
          onChange={(e) => handleChange(activeTab, e.target.value)}
          placeholder={getPlaceholder(activeTab)}
          disabled={disabled}
          rows={rows}
          className={cn(
            "w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white",
            "placeholder:text-white/40 transition-colors",
            "focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            getError(activeTab) && "border-red-500/50 focus:border-red-500/50",
            textareaClassName
          )}
        />
        {getError(activeTab) && (
          <p className="mt-1 text-xs text-red-400">{getError(activeTab)}</p>
        )}
      </div>
    </div>
  );
}

export { LANGUAGES };
