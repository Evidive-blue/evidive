import { Link } from "@/i18n/navigation";
import { Clock, Users, MapPin, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "./BookingStatusBadge";
import type { BookingStatus } from "@prisma/client";

type LocalizedJson = Record<string, unknown>;

function getLocalizedText(value: unknown, locale: string): string {
  if (!value || typeof value !== "object") return "";
  const obj = value as LocalizedJson;
  const direct = obj[locale];
  if (typeof direct === "string" && direct.trim().length > 0) return direct;
  const fallback = obj.fr;
  if (typeof fallback === "string" && fallback.trim().length > 0) return fallback;
  const en = obj.en;
  if (typeof en === "string" && en.trim().length > 0) return en;
  for (const key of Object.keys(obj)) {
    const v = obj[key];
    if (typeof v === "string" && v.trim().length > 0) return v;
  }
  return "";
}

interface BookingCardProps {
  booking: {
    id: string;
    reference: string;
    diveDate: Date;
    diveTime: Date;
    participants: number;
    totalPrice: string | number | { toString(): string };
    currency: string;
    status: BookingStatus;
    center: {
      name: unknown;
      city: string;
      country: string;
    };
    service: {
      name: unknown;
    };
  };
  locale: string;
  translations: {
    viewDetails: string;
    participants: string;
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
  };
}

export function BookingCard({ booking, locale, translations }: BookingCardProps) {
  const centerName = getLocalizedText(booking.center.name, locale) || "Centre";
  const serviceName = getLocalizedText(booking.service.name, locale) || "Service";
  const locationLabel = [booking.center.city, booking.center.country]
    .filter(Boolean)
    .join(", ");

  const formattedTime = new Date(booking.diveTime).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedPrice = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: booking.currency,
  }).format(Number(booking.totalPrice));

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden transition-all hover:bg-white/8 hover:border-white/20">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Date section */}
          <div className="flex flex-col items-center justify-center bg-gradient-to-br from-cyan-500/20 to-blue-600/20 p-4 sm:w-28 sm:min-w-28">
            <span className="text-2xl font-bold text-white">
              {new Date(booking.diveDate).getDate()}
            </span>
            <span className="text-sm text-white/70 capitalize">
              {new Date(booking.diveDate).toLocaleDateString(locale, { month: "short" })}
            </span>
            <span className="text-xs text-white/50">
              {new Date(booking.diveDate).getFullYear()}
            </span>
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col p-4 gap-3">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-lg font-semibold text-white">
                  {serviceName}
                </h3>
                <div className="flex items-center gap-1.5 text-sm text-white/60">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {centerName} {locationLabel && `· ${locationLabel}`}
                  </span>
                </div>
              </div>
              <BookingStatusBadge
                status={booking.status}
                translations={translations.statusLabels}
              />
            </div>

            {/* Details row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-cyan-400" />
                <span>{formattedTime}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-cyan-400" />
                <span>
                  {booking.participants} {translations.participants}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-emerald-400" />
                <span className="font-medium text-white">{formattedPrice}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-xs text-white/40">
                Réf: {booking.reference}
              </span>
              <Link href={`/bookings/${booking.id}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                >
                  {translations.viewDetails}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
