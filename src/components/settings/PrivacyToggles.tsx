"use client";

import { useState, useTransition, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { updatePrivacySettings } from "@/actions/settings";

interface PrivacyTogglesProps {
  initialProfileVisible: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface ToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  icon?: React.ReactNode;
}

function Toggle({
  label,
  description,
  enabled,
  onChange,
  disabled,
  icon,
}: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3 flex-1 pr-4">
        {icon && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
            {icon}
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-xs text-white/60">{description}</p>
        </div>
      </div>
      <button
        onClick={() => !disabled && onChange(!enabled)}
        disabled={disabled}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors",
          enabled ? "bg-cyan-500" : "bg-white/20",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        type="button"
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            enabled && "translate-x-5"
          )}
        />
      </button>
    </div>
  );
}

export function PrivacyToggles({
  initialProfileVisible,
  onSuccess,
  onError,
}: PrivacyTogglesProps) {
  const t = useTranslations("settings");
  const [isPending, startTransition] = useTransition();

  const [profileVisible, setProfileVisible] = useState(initialProfileVisible);

  const savePrivacySetting = useCallback(
    (field: "profileVisibleToCenters", value: boolean) => {
      startTransition(async () => {
        const result = await updatePrivacySettings({ [field]: value });
        if (result.ok) {
          onSuccess?.();
        } else {
          onError?.(result.error || "unknown_error");
          // Revert on error
          setProfileVisible(!value);
        }
      });
    },
    [onSuccess, onError]
  );

  const handleProfileVisibleToggle = (enabled: boolean) => {
    setProfileVisible(enabled);
    savePrivacySetting("profileVisibleToCenters", enabled);
  };

  return (
    <div className="divide-y divide-white/10">
      <Toggle
        label={t("privacy.profileVisible.label")}
        description={t("privacy.profileVisible.description")}
        enabled={profileVisible}
        onChange={handleProfileVisibleToggle}
        disabled={isPending}
        icon={<Eye className="h-4 w-4 text-cyan-400" />}
      />
    </div>
  );
}
