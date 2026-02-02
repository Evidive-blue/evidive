import { redirect, notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Calendar,
  MapPin,
  CreditCard,
  Mail,
  Phone,
  ArrowLeft,
  CalendarPlus,
  MessageSquare,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  Package,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/bookings";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateBookingCalendarUrl } from "@/lib/google-calendar";
import type { Metadata } from "next";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "bookings" });

  return {
    title: t("details.meta.title"),
    description: t("details.meta.description"),
  };
}

function normalizeDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function canCancelBooking(booking: {
  status: BookingStatus;
  diveDate: Date;
}): { canCancel: boolean; reason?: string } {
  const today = normalizeDateOnly(new Date());
  const diveDate = normalizeDateOnly(new Date(booking.diveDate));

  // Cannot cancel if already cancelled, completed, noshow, or removed
  if (["CANCELLED", "COMPLETED", "NOSHOW", "REMOVED"].includes(booking.status)) {
    return { canCancel: false, reason: "status_not_cancellable" };
  }

  // Cannot cancel if dive date is in the past
  if (diveDate < today) {
    return { canCancel: false, reason: "date_passed" };
  }

  // Cannot cancel if less than 48 hours before dive
  const hoursUntilDive =
    (diveDate.getTime() - today.getTime()) / (1000 * 60 * 60);
  if (hoursUntilDive < 48) {
    return { canCancel: false, reason: "too_close_to_date" };
  }

  return { canCancel: true };
}

export default async function BookingDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const t = await getTranslations({ locale, namespace: "bookings" });

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  // Fetch booking with all relations
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      center: {
        select: {
          id: true,
          slug: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          country: true,
        },
      },
      service: {
        select: {
          id: true,
          name: true,
          durationMinutes: true,
        },
      },
      extras: {
        include: {
          extra: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      review: {
        select: {
          id: true,
          rating: true,
        },
      },
    },
  });

  // Check if booking exists and belongs to user
  if (!booking) {
    notFound();
  }

  if (booking.userId !== session.user.id) {
    redirect(`/${locale}/bookings`);
  }

  const centerName = getLocalizedText(booking.center.name, locale) || "Centre";
  const serviceName = getLocalizedText(booking.service.name, locale) || "Service";
  const centerAddress = [
    booking.center.address,
    booking.center.city,
    booking.center.country,
  ]
    .filter(Boolean)
    .join(", ");

  const formattedDate = new Date(booking.diveDate).toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedTime = new Date(booking.diveTime).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedPrice = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: booking.currency,
  }).format(Number(booking.totalPrice));

  const formattedUnitPrice = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: booking.currency,
  }).format(Number(booking.unitPrice));

  const formattedExtrasPrice =
    Number(booking.extrasPrice) > 0
      ? new Intl.NumberFormat(locale, {
          style: "currency",
          currency: booking.currency,
        }).format(Number(booking.extrasPrice))
      : null;

  const formattedDiscount =
    Number(booking.discountAmount) > 0
      ? new Intl.NumberFormat(locale, {
          style: "currency",
          currency: booking.currency,
        }).format(Number(booking.discountAmount))
      : null;

  const paidAtFormatted = booking.paidAt
    ? new Date(booking.paidAt).toLocaleDateString(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  // Check cancellation eligibility
  const cancellation = canCancelBooking(booking);

  // Generate Google Calendar URL
  const googleCalendarUrl = generateBookingCalendarUrl({
    serviceName,
    centerName,
    centerAddress,
    diveDate: booking.diveDate,
    diveTime: booking.diveTime,
    durationMinutes: booking.service.durationMinutes,
    reference: booking.reference,
    participants: booking.participants,
    specialRequests: booking.specialRequests,
  });

  // Generate mailto link
  const mailtoSubject = encodeURIComponent(
    `[EviDive] ${t("details.emailSubject")} - ${booking.reference}`
  );
  const mailtoBody = encodeURIComponent(
    `${t("details.emailBody", { reference: booking.reference, date: formattedDate })}`
  );
  const mailtoUrl = `mailto:${booking.center.email}?subject=${mailtoSubject}&body=${mailtoBody}`;

  // Status translations
  const statusLabels = {
    PENDING: t("status.PENDING"),
    CONFIRMED: t("status.CONFIRMED"),
    PAID: t("status.PAID"),
    RUNNING: t("status.RUNNING"),
    COMPLETED: t("status.COMPLETED"),
    CANCELLED: t("status.CANCELLED"),
    NOSHOW: t("status.NOSHOW"),
    REMOVED: t("status.REMOVED"),
  };

  // Can leave review?
  const canLeaveReview = booking.status === "COMPLETED" && !booking.review;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Back button */}
        <Link
          href="/bookings"
          className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("details.backToBookings")}
        </Link>

        {/* Header Card */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-white">{serviceName}</h1>
                  <BookingStatusBadge
                    status={booking.status}
                    translations={statusLabels}
                  />
                </div>
                <div className="flex items-center gap-1.5 text-white/60">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{centerName}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-white/50">{t("details.reference")}</p>
                <p className="font-mono text-lg font-semibold text-white">
                  {booking.reference}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Date & Time */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-cyan-400" />
                {t("details.dateTime")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/60">{t("details.date")}</span>
                <span className="text-white font-medium capitalize">
                  {formattedDate}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">{t("details.time")}</span>
                <span className="text-white font-medium">{formattedTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">{t("details.participants")}</span>
                <span className="text-white font-medium">
                  {booking.participants}
                </span>
              </div>
              {booking.service.durationMinutes && (
                <div className="flex items-center justify-between">
                  <span className="text-white/60">{t("details.duration")}</span>
                  <span className="text-white font-medium">
                    {booking.service.durationMinutes} min
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-400" />
                {t("details.payment")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/60">{t("details.unitPrice")}</span>
                <span className="text-white">
                  {formattedUnitPrice} x {booking.participants}
                </span>
              </div>
              {formattedExtrasPrice && (
                <div className="flex items-center justify-between">
                  <span className="text-white/60">{t("details.extras")}</span>
                  <span className="text-white">{formattedExtrasPrice}</span>
                </div>
              )}
              {formattedDiscount && (
                <div className="flex items-center justify-between">
                  <span className="text-white/60">{t("details.discount")}</span>
                  <span className="text-emerald-400">-{formattedDiscount}</span>
                </div>
              )}
              <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                <span className="text-white font-medium">{t("details.total")}</span>
                <span className="text-xl font-bold text-white">
                  {formattedPrice}
                </span>
              </div>
              {paidAtFormatted && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  {t("details.paidOn", { date: paidAtFormatted })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Center Info */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-400" />
                {t("details.center")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-white font-medium">{centerName}</p>
              <p className="text-white/60 text-sm">{centerAddress}</p>
              {booking.center.email && (
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Mail className="h-4 w-4" />
                  {booking.center.email}
                </div>
              )}
              {booking.center.phone && (
                <div className="flex items-center gap-2 text-white/60 text-sm">
                  <Phone className="h-4 w-4" />
                  {booking.center.phone}
                </div>
              )}
              <Link href={`/center/${booking.center.slug}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                >
                  {t("details.viewCenter")}
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Special Requests & Extras */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-400" />
                {t("details.additionalInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {booking.extras.length > 0 && (
                <div>
                  <p className="text-white/60 text-sm mb-2 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    {t("details.selectedExtras")}
                  </p>
                  <ul className="space-y-1">
                    {booking.extras.map((be) => (
                      <li
                        key={be.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-white">
                          {getLocalizedText(be.extra.name, locale)}
                          {be.quantity > 1 && ` x${be.quantity}`}
                        </span>
                        <span className="text-white/60">
                          {new Intl.NumberFormat(locale, {
                            style: "currency",
                            currency: booking.currency,
                          }).format(Number(be.totalPrice))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {booking.specialRequests && (
                <div>
                  <p className="text-white/60 text-sm mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    {t("details.specialRequests")}
                  </p>
                  <p className="text-white text-sm bg-white/5 rounded-lg p-3">
                    {booking.specialRequests}
                  </p>
                </div>
              )}
              {!booking.extras.length && !booking.specialRequests && (
                <p className="text-white/40 text-sm">{t("details.noAdditionalInfo")}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl mt-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-3">
              {/* Google Calendar */}
              <a
                href={googleCalendarUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  {t("details.addToCalendar")}
                </Button>
              </a>

              {/* Contact Center */}
              <a href={mailtoUrl}>
                <Button
                  variant="outline"
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {t("details.contactCenter")}
                </Button>
              </a>

              {/* Leave Review */}
              {canLeaveReview && (
                <Link href={`/bookings/${booking.id}/review`}>
                  <Button className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-400 hover:to-orange-500">
                    <Star className="mr-2 h-4 w-4" />
                    {t("details.leaveReview")}
                  </Button>
                </Link>
              )}
            </div>

            {/* Cancellation Section */}
            <div className="mt-6 pt-6 border-t border-white/10">
              {cancellation.canCancel ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white text-sm font-medium">
                        {t("details.cancellation.title")}
                      </p>
                      <p className="text-white/60 text-sm">
                        {t("details.cancellation.warning")}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {t("details.cancel")}
                  </Button>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-white/40 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white/60 text-sm">
                      {t(`details.cancellation.reasons.${cancellation.reason}`)}
                    </p>
                    <a
                      href={mailtoUrl}
                      className="text-cyan-400 text-sm hover:text-cyan-300"
                    >
                      {t("details.cancellation.contactCenter")}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
