"use client";

import { useState, useTransition, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Bell, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateNotificationSettings } from "@/actions/settings";

interface NotificationTogglesProps {
  initialEmailNotifications: boolean;
  initialSmsNotifications: boolean;
  hasPhone: boolean;
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

export function NotificationToggles({
  initialEmailNotifications,
  initialSmsNotifications,
  hasPhone,
  onSuccess,
  onError,
}: NotificationTogglesProps) {
  const t = useTranslations("settings");
  const [isPending, startTransition] = useTransition();

  const [emailNotifications, setEmailNotifications] = useState(
    initialEmailNotifications
  );
  const [smsNotifications, setSmsNotifications] = useState(
    initialSmsNotifications
  );

  // Debounced save function
  const saveNotificationSetting = useCallback(
    (field: "emailNotifications" | "smsNotifications", value: boolean) => {
      startTransition(async () => {
        const result = await updateNotificationSettings({ [field]: value });
        if (result.ok) {
          onSuccess?.();
        } else {
          onError?.(result.error || "unknown_error");
          // Revert on error
          if (field === "emailNotifications") {
            setEmailNotifications(!value);
          } else {
            setSmsNotifications(!value);
          }
        }
      });
    },
    [onSuccess, onError]
  );

  const handleEmailToggle = (enabled: boolean) => {
    setEmailNotifications(enabled);
    saveNotificationSetting("emailNotifications", enabled);
  };

  const handleSmsToggle = (enabled: boolean) => {
    setSmsNotifications(enabled);
    saveNotificationSetting("smsNotifications", enabled);
  };

  return (
    <div className="divide-y divide-white/10">
      <Toggle
        label={t("notifications.email.label")}
        description={t("notifications.email.description")}
        enabled={emailNotifications}
        onChange={handleEmailToggle}
        disabled={isPending}
        icon={<Bell className="h-4 w-4 text-cyan-400" />}
      />
      {hasPhone && (
        <Toggle
          label={t("notifications.sms.label")}
          description={t("notifications.sms.description")}
          enabled={smsNotifications}
          onChange={handleSmsToggle}
          disabled={isPending}
          icon={<MessageSquare className="h-4 w-4 text-cyan-400" />}
        />
      )}
    </div>
  );
}
