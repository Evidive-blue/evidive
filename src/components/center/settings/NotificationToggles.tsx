"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Bell, Mail, MessageSquare, Clock } from "lucide-react";
import { updateCenterNotifications } from "@/actions/center-settings";

interface NotificationTogglesProps {
  centerId: string;
  initialValues: {
    emailOnNewBooking: boolean;
    emailOnCancellation: boolean;
    emailOnNewReview: boolean;
    smsOnNewBooking: boolean;
    dailyBookingReminder: boolean;
  };
  hasPhone: boolean;
  translations: {
    title: string;
    emailOnNewBooking: string;
    emailOnNewBookingDesc: string;
    emailOnCancellation: string;
    emailOnCancellationDesc: string;
    emailOnNewReview: string;
    emailOnNewReviewDesc: string;
    smsOnNewBooking: string;
    smsOnNewBookingDesc: string;
    smsRequiresPhone: string;
    dailyBookingReminder: string;
    dailyBookingReminderDesc: string;
    saved: string;
    error: string;
  };
}

export function NotificationToggles({
  centerId,
  initialValues,
  hasPhone,
  translations: t,
}: NotificationTogglesProps) {
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState(initialValues);

  const handleToggle = (
    field: keyof typeof values,
    newValue: boolean
  ) => {
    // Update local state immediately
    setValues((prev) => ({ ...prev, [field]: newValue }));

    // Save to server
    startTransition(async () => {
      const result = await updateCenterNotifications(centerId, {
        [field]: newValue,
      });

      if (result.ok) {
        toast.success(t.saved);
      } else {
        // Revert on error
        setValues((prev) => ({ ...prev, [field]: !newValue }));
        toast.error(t.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20">
          <Bell className="h-5 w-5 text-cyan-400" />
        </div>
        <h2 className="text-xl font-semibold text-white">{t.title}</h2>
      </div>

      <div className="space-y-4">
        {/* Email on new booking */}
        <div className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex gap-3">
            <Mail className="mt-0.5 h-5 w-5 text-cyan-400" />
            <div>
              <Label htmlFor="emailOnNewBooking" className="text-white">
                {t.emailOnNewBooking}
              </Label>
              <p className="mt-1 text-sm text-white/60">
                {t.emailOnNewBookingDesc}
              </p>
            </div>
          </div>
          <Switch
            id="emailOnNewBooking"
            checked={values.emailOnNewBooking}
            onCheckedChange={(checked) =>
              handleToggle("emailOnNewBooking", checked)
            }
            disabled={isPending}
          />
        </div>

        {/* Email on cancellation */}
        <div className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex gap-3">
            <Mail className="mt-0.5 h-5 w-5 text-cyan-400" />
            <div>
              <Label htmlFor="emailOnCancellation" className="text-white">
                {t.emailOnCancellation}
              </Label>
              <p className="mt-1 text-sm text-white/60">
                {t.emailOnCancellationDesc}
              </p>
            </div>
          </div>
          <Switch
            id="emailOnCancellation"
            checked={values.emailOnCancellation}
            onCheckedChange={(checked) =>
              handleToggle("emailOnCancellation", checked)
            }
            disabled={isPending}
          />
        </div>

        {/* Email on new review */}
        <div className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex gap-3">
            <Mail className="mt-0.5 h-5 w-5 text-cyan-400" />
            <div>
              <Label htmlFor="emailOnNewReview" className="text-white">
                {t.emailOnNewReview}
              </Label>
              <p className="mt-1 text-sm text-white/60">
                {t.emailOnNewReviewDesc}
              </p>
            </div>
          </div>
          <Switch
            id="emailOnNewReview"
            checked={values.emailOnNewReview}
            onCheckedChange={(checked) =>
              handleToggle("emailOnNewReview", checked)
            }
            disabled={isPending}
          />
        </div>

        {/* SMS on new booking */}
        <div className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex gap-3">
            <MessageSquare className="mt-0.5 h-5 w-5 text-cyan-400" />
            <div>
              <Label
                htmlFor="smsOnNewBooking"
                className={`text-white ${!hasPhone ? "opacity-60" : ""}`}
              >
                {t.smsOnNewBooking}
              </Label>
              <p className="mt-1 text-sm text-white/60">
                {hasPhone ? t.smsOnNewBookingDesc : t.smsRequiresPhone}
              </p>
            </div>
          </div>
          <Switch
            id="smsOnNewBooking"
            checked={values.smsOnNewBooking}
            onCheckedChange={(checked) =>
              handleToggle("smsOnNewBooking", checked)
            }
            disabled={isPending || !hasPhone}
          />
        </div>

        {/* Daily booking reminder */}
        <div className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex gap-3">
            <Clock className="mt-0.5 h-5 w-5 text-cyan-400" />
            <div>
              <Label htmlFor="dailyBookingReminder" className="text-white">
                {t.dailyBookingReminder}
              </Label>
              <p className="mt-1 text-sm text-white/60">
                {t.dailyBookingReminderDesc}
              </p>
            </div>
          </div>
          <Switch
            id="dailyBookingReminder"
            checked={values.dailyBookingReminder}
            onCheckedChange={(checked) =>
              handleToggle("dailyBookingReminder", checked)
            }
            disabled={isPending}
          />
        </div>
      </div>
    </div>
  );
}
