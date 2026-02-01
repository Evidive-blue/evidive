"use client";

import { useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { deleteCenter } from "@/actions/center-settings";
import { useRouter } from "next/navigation";

interface DeleteCenterModalProps {
  centerId: string;
  centerSlug: string;
  translations: {
    title: string;
    description: string;
    warningTitle: string;
    warningItems: string[];
    confirmLabel: string;
    confirmPlaceholder: string;
    confirmHint: string;
    deleteButton: string;
    cancel: string;
    confirm: string;
    deleting: string;
    success: string;
    error: string;
    mismatch: string;
    hasActiveBookings: string;
  };
}

export function DeleteCenterModal({
  centerId,
  centerSlug,
  translations: t,
}: DeleteCenterModalProps) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isConfirmationValid = confirmation === centerSlug;

  const handleDelete = () => {
    if (!isConfirmationValid) {
      toast.error(t.mismatch);
      return;
    }

    startTransition(async () => {
      const result = await deleteCenter(centerId, confirmation);

      if (result.ok) {
        toast.success(t.success);
        setOpen(false);
        router.push("/dashboard");
      } else if (result.error === "has_active_bookings") {
        toast.error(t.hasActiveBookings);
      } else if (result.error === "confirmation_mismatch") {
        toast.error(t.mismatch);
      } else {
        toast.error(t.error);
      }
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setConfirmation("");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t.deleteButton}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-white/10 bg-slate-900">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            {t.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-white/60">
            {t.description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Warning box */}
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <h4 className="font-semibold text-red-400">{t.warningTitle}</h4>
          <ul className="mt-2 space-y-1 text-sm text-red-200/80">
            {t.warningItems.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 rounded-full bg-red-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Confirmation input */}
        <div className="space-y-2">
          <Label className="text-white">{t.confirmLabel}</Label>
          <Input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={t.confirmPlaceholder}
            className="border-white/20 bg-white/5 font-mono text-white"
            autoComplete="off"
          />
          <p className="text-sm text-white/60">
            {t.confirmHint}{" "}
            <code className="rounded bg-white/10 px-1 py-0.5 font-mono text-cyan-400">
              {centerSlug}
            </code>
          </p>
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
            className="border-white/20 text-white hover:bg-white/10"
          >
            {t.cancel}
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isPending || !isConfirmationValid}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.deleting}
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                {t.confirm}
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
