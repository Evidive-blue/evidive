import { Link } from "@/i18n/navigation";
import { Calendar, MapPin, ChevronRight, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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

interface UpcomingBooking {
  id: string;
  reference: string;
  diveDate: Date;
  status: string;
  center: {
    id: string;
    slug: string;
    name: unknown; // JSON
    city: string;
    country: string;
  };
  service: {
    id: string;
    name: unknown; // JSON
  };
}

interface UpcomingDivesWidgetProps {
  bookings: UpcomingBooking[];
  locale: string;
  translations: {
    title: string;
    viewDetails: string;
    emptyTitle: string;
    emptyDesc: string;
    exploreOffers: string;
    status: Record<string, string>;
  };
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-500/20 text-amber-400",
  CONFIRMED: "bg-emerald-500/20 text-emerald-400",
  PAID: "bg-cyan-500/20 text-cyan-400",
  RUNNING: "bg-blue-500/20 text-blue-400",
  COMPLETED: "bg-green-500/20 text-green-400",
  CANCELLED: "bg-red-500/20 text-red-400",
  NOSHOW: "bg-gray-500/20 text-gray-400",
  REMOVED: "bg-gray-500/20 text-gray-400",
};

export function UpcomingDivesWidget({
  bookings,
  locale,
  translations: t,
}: UpcomingDivesWidgetProps) {
  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="text-white flex items-center gap-2">
          <Calendar className="h-5 w-5 text-cyan-400" />
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
              <Calendar className="h-8 w-8 text-white/40" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">
              {t.emptyTitle}
            </h3>
            <p className="mb-6 max-w-sm text-sm text-white/60">
              {t.emptyDesc}
            </p>
            <Link href="/explorer">
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500">
                <Waves className="mr-2 h-4 w-4" />
                {t.exploreOffers}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => {
              const centerName = getLocalizedText(booking.center.name, locale) || booking.center.slug;
              const serviceName = getLocalizedText(booking.service.name, locale) || booking.reference;
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
                      <div className="flex items-center gap-2 mb-1">
                        <span className="truncate text-sm font-semibold text-white">
                          {serviceName}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                            statusColors[booking.status] || "bg-gray-500/20 text-gray-400"
                          )}
                        >
                          {t.status[booking.status] || booking.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-white/60">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">
                          {locationLabel ? `${centerName} · ${locationLabel}` : centerName}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-sm font-medium text-white tabular-nums">
                        {new Date(booking.diveDate).toLocaleDateString(locale, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      <Link href={`/bookings/${booking.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-cyan-400 hover:text-cyan-300"
                        >
                          {t.viewDetails}
                          <ChevronRight className="ml-1 h-3 w-3" />
                        </Button>
                      </Link>
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
