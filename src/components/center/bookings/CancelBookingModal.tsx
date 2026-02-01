"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle, Loader2 } from "lucide-react";
import { updateBookingStatus } from "@/app/[locale]/center/bookings/actions";

interface CancelBookingModalProps {
  bookingId: string;
  reference: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  translations: {
    title: string;
    description: string;
    reasonLabel: string;
    reasonPlaceholder: string;
    reasonRequired: string;
    cancel: string;
    confirm: string;
    confirming: string;
    warning: string;
    success: string;
    error: string;
  };
}

export function CancelBookingModal({
  bookingId,
  reference,
  open,
  onOpenChange,
  onSuccess,
  translations: t,
}: CancelBookingModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCancel = () => {
    if (!reason.trim()) {
      setError(t.reasonRequired);
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await updateBookingStatus(bookingId, "CANCELLED", reason.trim());

      if (result.success) {
        onOpenChange(false);
        setReason("");
        onSuccess?.();
      } else {
        setError(result.error || t.error);
      }
    });
  };

  const handleClose = () => {
    if (!isPending) {
      onOpenChange(false);
      setReason("");
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="border-white/10 bg-gray-900/95 backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            {t.title}
          </DialogTitle>
          <DialogDescription className="text-white/60">
            {t.description.replace("{reference}", reference)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning */}
          <div className="rounded-lg bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-300">{t.warning}</p>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              {t.reasonLabel} *
            </label>
            <Textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder={t.reasonPlaceholder}
              className="min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-white/40 resize-none"
              disabled={isPending}
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
        </div>

        <DialogFooter className="flex gap-3 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
            className="border-white/20 text-white hover:bg-white/10"
          >
            {t.cancel}
          </Button>
          <Button
            onClick={handleCancel}
            disabled={isPending || !reason.trim()}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.confirming}
              </>
            ) : (
              t.confirm
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
