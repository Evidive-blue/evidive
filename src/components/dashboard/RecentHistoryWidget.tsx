import { Link } from "@/i18n/navigation";
import { History, Star, MapPin, MessageSquare, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

interface PastBooking {
  id: string;
  reference: string;
  diveDate: Date;
  center: {
    id: string;
    slug: string;
    name: unknown; // JSON
    city: string;
    country: string;
  };
  review: {
    id: string;
    rating: number;
  } | null;
}

interface RecentHistoryWidgetProps {
  bookings: PastBooking[];
  locale: string;
  translations: {
    title: string;
    viewAll: string;
    emptyTitle: string;
    emptyDesc: string;
    leaveReview: string;
    rating: string;
  };
}

export function RecentHistoryWidget({
  bookings,
  locale,
  translations: t,
}: RecentHistoryWidgetProps) {
  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
      <CardHeader className="border-b border-white/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <History className="h-5 w-5 text-purple-400" />
            {t.title}
          </CardTitle>
          {bookings.length > 0 && (
            <Link href="/bookings?filter=completed">
              <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
                {t.viewAll}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
              <History className="h-8 w-8 text-white/40" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">
              {t.emptyTitle}
            </h3>
            <p className="mb-6 max-w-sm text-sm text-white/60">
              {t.emptyDesc}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => {
              const centerName = getLocalizedText(booking.center.name, locale) || booking.center.slug;
              const locationLabel = [booking.center.city, booking.center.country]
                .filter(Boolean)
                .join(", ");

              return (
                <div
                  key={booking.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-white mb-1">
                        {centerName}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-white/60 mb-2">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{locationLabel}</span>
                      </div>
                      <div className="text-xs text-white/50">
                        {new Date(booking.diveDate).toLocaleDateString(locale, {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {booking.review ? (
                        <div className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1">
                          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-sm font-medium text-amber-400">
                            {t.rating.replace("{rating}", String(booking.review.rating))}
                          </span>
                        </div>
                      ) : (
                        <Link href={`/reviews/new?booking=${booking.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-emerald-400 hover:text-emerald-300"
                          >
                            <MessageSquare className="mr-1 h-3 w-3" />
                            {t.leaveReview}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
