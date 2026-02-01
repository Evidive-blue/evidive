"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Check,
  X,
  Mail,
  Printer,
  MoreVertical,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { updateBookingStatus } from "@/app/[locale]/center/bookings/actions";
import type { BookingStatus } from "@prisma/client";

interface BookingDetailsActionsProps {
  bookingId: string;
  currentStatus: BookingStatus;
  clientEmail: string;
  reference: string;
  translations: {
    confirm: string;
    cancel: string;
    markCompleted: string;
    markNoShow: string;
    contactClient: string;
    printDetails: string;
  };
}

export function BookingDetailsActions({
  bookingId,
  currentStatus,
  clientEmail,
  reference,
  translations: t,
}: BookingDetailsActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [actionType, setActionType] = useState<string | null>(null);

  const handleAction = async (action: "confirm" | "cancel" | "complete" | "noshow") => {
    setActionType(action);

    startTransition(async () => {
      const statusMap: Record<string, BookingStatus> = {
        confirm: "CONFIRMED",
        cancel: "CANCELLED",
        complete: "COMPLETED",
        noshow: "NOSHOW",
      };

      await updateBookingStatus(bookingId, statusMap[action]);
      setActionType(null);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const canConfirm = currentStatus === "PENDING";
  const canCancel = ["PENDING", "CONFIRMED"].includes(currentStatus);
  const canComplete = ["CONFIRMED", "PAID", "RUNNING"].includes(currentStatus);
  const canMarkNoShow = ["CONFIRMED", "PAID", "RUNNING"].includes(currentStatus);

  return (
    <div className="flex items-center gap-2">
      {canConfirm && (
        <Button
          onClick={() => handleAction("confirm")}
          disabled={isPending}
          className="bg-emerald-500 hover:bg-emerald-600 text-white"
        >
          {isPending && actionType === "confirm" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-2 h-4 w-4" />
          )}
          {t.confirm}
        </Button>
      )}

      {canCancel && (
        <Button
          onClick={() => handleAction("cancel")}
          disabled={isPending}
          variant="outline"
          className="border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"
        >
          {isPending && actionType === "cancel" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <X className="mr-2 h-4 w-4" />
          )}
          {t.cancel}
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="border-white/10 bg-white/5 text-white hover:bg-white/10">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="border-white/10 bg-gray-900">
          <DropdownMenuItem asChild>
            <a
              href={`mailto:${clientEmail}?subject=Réservation ${reference}`}
              className="flex items-center gap-2 text-white"
            >
              <Mail className="h-4 w-4" />
              {t.contactClient}
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handlePrint}
            className="flex items-center gap-2 text-white"
          >
            <Printer className="h-4 w-4" />
            {t.printDetails}
          </DropdownMenuItem>

          {(canComplete || canMarkNoShow) && (
            <>
              <DropdownMenuSeparator className="bg-white/10" />
              {canComplete && (
                <DropdownMenuItem
                  onClick={() => handleAction("complete")}
                  disabled={isPending}
                  className="flex items-center gap-2 text-emerald-400"
                >
                  {isPending && actionType === "complete" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {t.markCompleted}
                </DropdownMenuItem>
              )}
              {canMarkNoShow && (
                <DropdownMenuItem
                  onClick={() => handleAction("noshow")}
                  disabled={isPending}
                  className="flex items-center gap-2 text-orange-400"
                >
                  {isPending && actionType === "noshow" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  {t.markNoShow}
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
