"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import {
  Check,
  X,
  Clock,
  Users,
  ChevronRight,
  CalendarClock,
  Loader2,
} from "lucide-react";
import { confirmBooking, rejectBooking } from "@/actions/center-bookings";

interface BookingUser {
  firstName: string | null;
  lastName: string | null;
  email: string;
  avatarUrl: string | null;
}

interface PendingBooking {
  id: string;
  reference: string;
  diveDate: Date;
  diveTime: Date;
  participants: number;
  totalPrice: number;
  currency: string;
  guestFirstName: string | null;
  guestLastName: string | null;
  guestEmail: string;
  user: BookingUser | null;
  service: {
    name: string;
  };
}

interface PendingBookingsWidgetProps {
  bookings: PendingBooking[];
  locale: string;
  translations: {
    title: string;
    emptyTitle: string;
    emptyDescription: string;
    confirm: string;
    reject: string;
    participants: string;
    viewAll: string;
  };
}

function formatDate(date: Date, locale: string): string {
  return new Date(date).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getClientName(booking: PendingBooking): string {
  if (booking.user) {
    const parts = [booking.user.firstName, booking.user.lastName].filter(Boolean);
    return parts.join(" ") || booking.user.email.split("@")[0];
  }
  const parts = [booking.guestFirstName, booking.guestLastName].filter(Boolean);
  return parts.join(" ") || booking.guestEmail.split("@")[0];
}

function getClientEmail(booking: PendingBooking): string {
  return booking.user?.email || booking.guestEmail;
}

function BookingCard({
  booking,
  locale,
  translations,
}: {
  booking: PendingBooking;
  locale: string;
  translations: PendingBookingsWidgetProps["translations"];
}) {
  const [isPending, startTransition] = useTransition();
  const [actionType, setActionType] = useState<"confirm" | "reject" | null>(null);
  const [isProcessed, setIsProcessed] = useState(false);

  const handleConfirm = () => {
    setActionType("confirm");
    startTransition(async () => {
      await confirmBooking(booking.id);
      setIsProcessed(true);
    });
  };

  const handleReject = () => {
    setActionType("reject");
    startTransition(async () => {
      await rejectBooking(booking.id);
      setIsProcessed(true);
    });
  };

  if (isProcessed) {
    return null;
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-white">
              {getClientName(booking)}
            </span>
            <span className="shrink-0 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-200">
              <Clock className="mr-1 inline h-3 w-3" />
              {booking.reference}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-white/50">
            {getClientEmail(booking)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-emerald-400">
            {booking.totalPrice.toLocaleString(locale === "fr" ? "fr-FR" : "en-US", {
              style: "currency",
              currency: booking.currency,
            })}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/60">
        <span className="flex items-center gap-1">
          <CalendarClock className="h-4 w-4" />
          {formatDate(booking.diveDate, locale)} · {formatTime(booking.diveTime)}
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          {booking.participants} {translations.participants}
        </span>
      </div>

      <p className="mt-2 truncate text-sm text-cyan-300">{booking.service.name}</p>

      <div className="mt-4 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleConfirm}
          disabled={isPending}
          className="flex-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 hover:text-emerald-100"
        >
          {isPending && actionType === "confirm" ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-1 h-4 w-4" />
          )}
          {translations.confirm}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleReject}
          disabled={isPending}
          className="flex-1 border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20 hover:text-red-100"
        >
          {isPending && actionType === "reject" ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <X className="mr-1 h-4 w-4" />
          )}
          {translations.reject}
        </Button>
      </div>
    </div>
  );
}

export function PendingBookingsWidget({
  bookings,
  locale,
  translations: t,
}: PendingBookingsWidgetProps) {
  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between border-b border-white/10">
        <CardTitle className="text-lg text-white">{t.title}</CardTitle>
        <Link
          href="/center/bookings"
          className="flex items-center gap-1 text-sm text-cyan-400 transition hover:text-cyan-300"
        >
          {t.viewAll}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </CardHeader>
      <CardContent className="p-4">
        {bookings.length === 0 ? (
          <div className="py-8 text-center">
            <CalendarClock className="mx-auto h-12 w-12 text-white/20" />
            <h3 className="mt-4 text-lg font-medium text-white/80">
              {t.emptyTitle}
            </h3>
            <p className="mt-2 text-sm text-white/50">{t.emptyDescription}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                locale={locale}
                translations={t}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
