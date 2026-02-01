"use client";

import * as React from "react";
import {
  Popup,
  PopupContent,
  PopupHeader,
  PopupTitle,
  PopupDescription,
  PopupFooter,
} from "@/components/ui/popup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { blockDateAction, unblockDateAction } from "@/app/[locale]/center/calendar/actions";
import { cn } from "@/lib/utils";
import { Calendar, Clock, Loader2, Ban, Trash2 } from "lucide-react";

interface BlockedDateData {
  id: string;
  blockedDate: string;
  reason: string | null;
  allDay: boolean;
  blockedTimes: string[];
}

interface BlockDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  centerId: string;
  existingBlock?: BlockedDateData;
  locale: string;
  translations: {
    blockDateTitle: string;
    blockDateReason: string;
    blockDateReasonPlaceholder: string;
    blockAllDay: string;
    blockSpecificTimes: string;
    cancel: string;
    confirm: string;
    removeBlockedDate: string;
    blockType?: string;
    slotsToBlock?: string;
  };
}

const DEFAULT_TIMES = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
];

export function BlockDateModal({
  isOpen,
  onClose,
  date,
  centerId,
  existingBlock,
  locale,
  translations: t,
}: BlockDateModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [reason, setReason] = React.useState(existingBlock?.reason || "");
  const [allDay, setAllDay] = React.useState(existingBlock?.allDay ?? true);
  const [selectedTimes, setSelectedTimes] = React.useState<string[]>(
    existingBlock?.blockedTimes || []
  );

  const formattedDate = date.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("centerId", centerId);
    formData.set("blockedDate", date.toISOString());
    formData.set("reason", reason);
    formData.set("allDay", String(allDay));
    selectedTimes.forEach((time) => {
      formData.append("blockedTimes", time);
    });

    const result = await blockDateAction(formData);
    setIsSubmitting(false);

    if (result.success) {
      onClose();
    }
  };

  const handleUnblock = async () => {
    if (!existingBlock) return;

    setIsSubmitting(true);
    const formData = new FormData();
    formData.set("id", existingBlock.id);
    formData.set("centerId", centerId);

    const result = await unblockDateAction(formData);
    setIsSubmitting(false);

    if (result.success) {
      onClose();
    }
  };

  const toggleTime = (time: string) => {
    setSelectedTimes((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]
    );
  };

  return (
    <Popup open={isOpen} onOpenChange={onClose}>
      <PopupContent className="max-w-md">
        <PopupHeader>
          <PopupTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-red-400" />
            {t.blockDateTitle}
          </PopupTitle>
          <PopupDescription className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {formattedDate}
          </PopupDescription>
        </PopupHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Reason */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">
              {t.blockDateReason}
            </label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t.blockDateReasonPlaceholder}
              className="border-white/10 bg-white/5 text-white placeholder:text-white/40"
            />
          </div>

          {/* Block type */}
          <div>
            <div className="mb-2 text-sm font-medium text-white">{t.blockType || "Block type"}</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAllDay(true)}
                className={cn(
                  "flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition",
                  allDay
                    ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                    : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                )}
              >
                {t.blockAllDay}
              </button>
              <button
                type="button"
                onClick={() => setAllDay(false)}
                className={cn(
                  "flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition",
                  !allDay
                    ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                    : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                )}
              >
                {t.blockSpecificTimes}
              </button>
            </div>
          </div>

          {/* Time selection */}
          {!allDay && (
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                <Clock className="h-4 w-4" />
                {t.slotsToBlock || "Slots to block"}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {DEFAULT_TIMES.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => toggleTime(time)}
                    className={cn(
                      "rounded-lg border px-2 py-1.5 text-xs font-medium transition",
                      selectedTimes.includes(time)
                        ? "border-red-500/30 bg-red-500/10 text-red-300"
                        : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}

          <PopupFooter className="mt-6">
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-between">
              {existingBlock && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleUnblock}
                  disabled={isSubmitting}
                  className="order-3 sm:order-1"
                >
                  <Trash2 className="h-4 w-4" />
                  {t.removeBlockedDate}
                </Button>
              )}
              <div className={cn("flex gap-2", !existingBlock && "w-full justify-end")}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  {t.cancel}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || (!allDay && selectedTimes.length === 0)}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Ban className="h-4 w-4" />
                  )}
                  {t.confirm}
                </Button>
              </div>
            </div>
          </PopupFooter>
        </form>
      </PopupContent>
    </Popup>
  );
}
