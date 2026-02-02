"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { format, type Locale } from "date-fns";
import { fr, enUS, es, it, de } from "date-fns/locale";
import { MessageSquarePlus, Calendar, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReviewForm } from "./ReviewForm";

const dateLocales: Record<string, Locale> = {
  fr,
  en: enUS,
  es,
  it,
  de,
};

interface PendingBooking {
  id: string;
  reference: string;
  diveDate: Date;
  diveTime: Date;
  center: {
    id: string;
    slug: string;
    name: string;
    logoUrl: string | null;
    city: string;
    country: string;
  };
  service: {
    id: string;
    name: string;
  };
}

interface PendingReviewsListProps {
  bookings: PendingBooking[];
  locale: string;
  onReviewCreated?: () => void;
}

export function PendingReviewsList({
  bookings,
  locale,
  onReviewCreated,
}: PendingReviewsListProps) {
  const t = useTranslations("reviews");
  const [selectedBooking, setSelectedBooking] = useState<PendingBooking | null>(
    null
  );
  const dateLocale = dateLocales[locale] || enUS;

  const getLocalizedText = (value: unknown): string => {
    if (!value || typeof value !== "object") return "";
    const obj = value as Record<string, unknown>;
    const direct = obj[locale];
    if (typeof direct === "string" && direct.trim().length > 0) return direct;
    const fallback = obj.fr;
    if (typeof fallback === "string" && fallback.trim().length > 0)
      return fallback;
    const en = obj.en;
    if (typeof en === "string" && en.trim().length > 0) return en;
    for (const key of Object.keys(obj)) {
      const v = obj[key];
      if (typeof v === "string" && v.trim().length > 0) return v;
    }
    return "";
  };

  if (bookings.length === 0) {
    return (
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-white flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-cyan-400" />
            {t("pendingReviews")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <svg
                className="h-8 w-8 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-white/60">{t("noPendingReviews")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-white flex items-center gap-2">
            <MessageSquarePlus className="h-5 w-5 text-cyan-400" />
            {t("pendingReviews")}
            <span className="ml-auto text-sm font-normal text-white/50">
              {bookings.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {bookings.map((booking) => {
              const centerName = getLocalizedText(booking.center.name);
              const serviceName = getLocalizedText(booking.service.name);

              return (
                <div
                  key={booking.id}
                  className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:bg-white/5 transition-colors"
                >
                  {/* Center logo */}
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/10">
                    {booking.center.logoUrl ? (
                      <Image
                        src={booking.center.logoUrl}
                        alt={centerName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-bold text-white/50">
                        {centerName.charAt(0)}
                      </div>
                    )}
                  </div>

                  {/* Booking info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white truncate">
                      {serviceName || booking.reference}
                    </h4>
                    <p className="text-sm text-white/60 truncate">{centerName}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(booking.diveDate), "dd MMM yyyy", {
                          locale: dateLocale,
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {booking.center.city}, {booking.center.country}
                      </span>
                    </div>
                  </div>

                  {/* CTA */}
                  <Button
                    onClick={() => setSelectedBooking(booking)}
                    className="shrink-0 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500"
                    size="sm"
                  >
                    {t("leaveReview")}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Review Form Modal */}
      {selectedBooking && (
        <ReviewForm
          mode="create"
          bookingId={selectedBooking.id}
          centerName={getLocalizedText(selectedBooking.center.name)}
          serviceName={getLocalizedText(selectedBooking.service.name)}
          onClose={() => setSelectedBooking(null)}
          onSuccess={onReviewCreated}
        />
      )}
    </>
  );
}
