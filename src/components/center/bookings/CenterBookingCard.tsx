"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import {
  Check,
  X,
  Clock,
  Users,
  Mail,
  Eye,
  CalendarClock,
  Loader2,
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import { CancelBookingModal } from "./CancelBookingModal";
import { updateBookingStatus } from "@/app/[locale]/center/bookings/actions";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@prisma/client";

interface CenterBookingCardProps {
  booking: {
    id: string;
    reference: string;
    diveDate: Date;
    diveTime: Date;
    participants: number;
    totalPrice: number;
    currency: string;
    status: BookingStatus;
    source: string;
    guestFirstName: string | null;
    guestLastName: string | null;
    guestEmail: string;
    guestPhone: string | null;
    specialRequests: string | null;
    user: {
      firstName: string | null;
      lastName: string | null;
      email: string;
      avatarUrl: string | null;
    } | null;
    service: {
      name: string;
    };
    extras: Array<{
      name: string;
      quantity: number;
      totalPrice: number;
    }>;
  };
  locale: string;
  translations: {
    viewDetails: string;
    confirm: string;
    cancel: string;
    markCompleted: string;
    markNoShow: string;
    contactClient: string;
    participants: string;
    extras: string;
    source: string;
    specialRequests: string;
    statusLabels: {
      PENDING: string;
      CONFIRMED: string;
      PAID: string;
      RUNNING: string;
      COMPLETED: string;
      CANCELLED: string;
      NOSHOW: string;
      REMOVED: string;
    };
    sources: {
      website: string;
      manual: string;
      api: string;
    };
    actions: string;
    confirmSuccess: string;
    cancelSuccess: string;
    completeSuccess: string;
    error: string;
    cancelModal: {
      title: string;
      description: string;
      reasonLabel: string;
      reasonPlaceholder: string;
      reasonRequired: string;
      cancelButton: string;
      confirmButton: string;
      confirming: string;
      warning: string;
      success: string;
      error: string;
    };
  };
}

function formatDate(date: Date, locale: string): string {
  return new Date(date).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getClientName(booking: CenterBookingCardProps["booking"]): string {
  if (booking.user) {
    const parts = [booking.user.firstName, booking.user.lastName].filter(Boolean);
    return parts.join(" ") || booking.user.email.split("@")[0];
  }
  const parts = [booking.guestFirstName, booking.guestLastName].filter(Boolean);
  return parts.join(" ") || booking.guestEmail.split("@")[0];
}

function getClientEmail(booking: CenterBookingCardProps["booking"]): string {
  return booking.user?.email || booking.guestEmail;
}

export function CenterBookingCard({
  booking,
  locale,
  translations: t,
}: CenterBookingCardProps) {
  const [isPending, startTransition] = useTransition();
  const [actionType, setActionType] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleAction = async (action: "confirm" | "complete" | "noshow") => {
    setActionType(action);
    setMessage(null);

    startTransition(async () => {
      const statusMap: Record<string, BookingStatus> = {
        confirm: "CONFIRMED",
        complete: "COMPLETED",
        noshow: "NOSHOW",
      };

      const result = await updateBookingStatus(booking.id, statusMap[action]);

      if (result.success) {
        const successMessages: Record<string, string> = {
          confirm: t.confirmSuccess,
          complete: t.completeSuccess,
          noshow: t.completeSuccess,
        };
        setMessage({ type: "success", text: successMessages[action] });
      } else {
        setMessage({ type: "error", text: result.error || t.error });
      }

      setActionType(null);
    });
  };

  const handleCancelSuccess = () => {
    setMessage({ type: "success", text: t.cancelSuccess });
  };

  const formattedPrice = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: booking.currency,
  }).format(booking.totalPrice);

  const canConfirm = booking.status === "PENDING";
  const canCancel = ["PENDING", "CONFIRMED"].includes(booking.status);
  const canComplete = ["CONFIRMED", "PAID", "RUNNING"].includes(booking.status);
  const canMarkNoShow = ["CONFIRMED", "PAID", "RUNNING"].includes(booking.status);

  const sourceLabel = t.sources[booking.source as keyof typeof t.sources] || booking.source;

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden transition-all hover:bg-white/8 hover:border-white/20">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          {/* Date Section */}
          <div className="flex flex-col items-center justify-center bg-gradient-to-br from-cyan-500/20 to-blue-600/20 p-4 lg:w-28 lg:min-w-28">
            <span className="text-2xl font-bold text-white">
              {new Date(booking.diveDate).getDate()}
            </span>
            <span className="text-sm text-white/70 capitalize">
              {new Date(booking.diveDate).toLocaleDateString(locale, { month: "short" })}
            </span>
            <span className="text-xs text-white/50">
              {new Date(booking.diveDate).getFullYear()}
            </span>
            <span className="mt-2 text-sm font-medium text-cyan-300">
              {formatTime(booking.diveTime)}
            </span>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4">
            {/* Header Row */}
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-white">{getClientName(booking)}</h3>
                  <span className="text-xs text-white/40 border border-white/10 rounded px-1.5 py-0.5">
                    {booking.reference}
                  </span>
                  {booking.source === "manual" && (
                    <span className="text-xs bg-purple-500/20 text-purple-300 rounded px-1.5 py-0.5">
                      {sourceLabel}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-white/50">{getClientEmail(booking)}</p>
                {booking.guestPhone && (
                  <p className="text-xs text-white/40">{booking.guestPhone}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <BookingStatusBadge
                  status={booking.status}
                  translations={t.statusLabels}
                />
                <p className="font-semibold text-emerald-400">{formattedPrice}</p>
              </div>
            </div>

            {/* Service & Details */}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
              <span className="text-cyan-300 font-medium">{booking.service.name}</span>
              <span className="flex items-center gap-1 text-white/60">
                <Users className="h-4 w-4" />
                {booking.participants} {t.participants}
              </span>
            </div>

            {/* Extras */}
            {booking.extras.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-white/40">{t.extras}: </span>
                <span className="text-xs text-white/60">
                  {booking.extras.map((e) => `${e.name} (x${e.quantity})`).join(", ")}
                </span>
              </div>
            )}

            {/* Special Requests */}
            {booking.specialRequests && (
              <div className="mt-2 rounded bg-amber-500/10 px-2 py-1">
                <span className="text-xs text-amber-300">
                  {t.specialRequests}: {booking.specialRequests}
                </span>
              </div>
            )}

            {/* Message */}
            {message && (
              <div
                className={cn(
                  "mt-3 flex items-center gap-2 rounded px-3 py-2 text-sm",
                  message.type === "success"
                    ? "bg-emerald-500/10 text-emerald-300"
                    : "bg-red-500/10 text-red-300"
                )}
              >
                {message.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {message.text}
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
              <div className="flex gap-2">
                {canConfirm && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction("confirm")}
                    disabled={isPending}
                    className="border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                  >
                    {isPending && actionType === "confirm" ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-1 h-4 w-4" />
                    )}
                    {t.confirm}
                  </Button>
                )}

                {canCancel && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCancelModal(true)}
                    disabled={isPending}
                    className="border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                  >
                    <X className="mr-1 h-4 w-4" />
                    {t.cancel}
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white/60 hover:text-white"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="border-white/10 bg-gray-900"
                  >
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/center/bookings/${booking.id}`}
                        className="flex items-center gap-2 text-white"
                      >
                        <Eye className="h-4 w-4" />
                        {t.viewDetails}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a
                        href={`mailto:${getClientEmail(booking)}?subject=Réservation ${booking.reference}`}
                        className="flex items-center gap-2 text-white"
                      >
                        <Mail className="h-4 w-4" />
                        {t.contactClient}
                      </a>
                    </DropdownMenuItem>
                    {canComplete && (
                      <>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem
                          onClick={() => handleAction("complete")}
                          disabled={isPending}
                          className="flex items-center gap-2 text-emerald-400"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {t.markCompleted}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleAction("noshow")}
                          disabled={isPending}
                          className="flex items-center gap-2 text-orange-400"
                        >
                          <AlertCircle className="h-4 w-4" />
                          {t.markNoShow}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Link href={`/center/bookings/${booking.id}`}>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                  >
                    {t.viewDetails}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Cancel Modal */}
      <CancelBookingModal
        bookingId={booking.id}
        reference={booking.reference}
        open={showCancelModal}
        onOpenChange={setShowCancelModal}
        onSuccess={handleCancelSuccess}
        translations={{
          title: t.cancelModal.title,
          description: t.cancelModal.description,
          reasonLabel: t.cancelModal.reasonLabel,
          reasonPlaceholder: t.cancelModal.reasonPlaceholder,
          reasonRequired: t.cancelModal.reasonRequired,
          cancel: t.cancelModal.cancelButton,
          confirm: t.cancelModal.confirmButton,
          confirming: t.cancelModal.confirming,
          warning: t.cancelModal.warning,
          success: t.cancelModal.success,
          error: t.cancelModal.error,
        }}
      />
    </Card>
  );
}
