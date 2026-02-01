"use client";

import { useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PauseCircle, Loader2 } from "lucide-react";
import { deactivateCenter, reactivateCenter } from "@/actions/center-settings";
import { useRouter } from "next/navigation";

interface DeactivateCenterModalProps {
  centerId: string;
  isSuspended: boolean;
  translations: {
    deactivateTitle: string;
    deactivateDescription: string;
    deactivateButton: string;
    reactivateTitle: string;
    reactivateDescription: string;
    reactivateButton: string;
    cancel: string;
    confirm: string;
    confirming: string;
    success: string;
    reactivateSuccess: string;
    error: string;
  };
}

export function DeactivateCenterModal({
  centerId,
  isSuspended,
  translations: t,
}: DeactivateCenterModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAction = () => {
    startTransition(async () => {
      const result = isSuspended
        ? await reactivateCenter(centerId)
        : await deactivateCenter(centerId);

      if (result.ok) {
        toast.success(isSuspended ? t.reactivateSuccess : t.success);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(t.error);
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          className={`${
            isSuspended
              ? "border-green-500/30 text-green-400 hover:bg-green-500/10"
              : "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
          }`}
        >
          <PauseCircle className="mr-2 h-4 w-4" />
          {isSuspended ? t.reactivateButton : t.deactivateButton}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-white/10 bg-slate-900">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            {isSuspended ? t.reactivateTitle : t.deactivateTitle}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-white/60">
            {isSuspended ? t.reactivateDescription : t.deactivateDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isPending}
            className="border-white/20 text-white hover:bg-white/10"
          >
            {t.cancel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleAction}
            disabled={isPending}
            className={`${
              isSuspended
                ? "bg-green-600 hover:bg-green-700"
                : "bg-amber-600 hover:bg-amber-700"
            }`}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.confirming}
              </>
            ) : (
              t.confirm
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
