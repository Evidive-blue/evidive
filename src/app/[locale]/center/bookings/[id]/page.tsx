import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/bookings/BookingStatusBadge";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Mail,
  Phone,
  CreditCard,
  FileText,
  Tag,
  User,
  MessageSquare,
  ExternalLink,
  TrendingUp,
} from "lucide-react";
import { BookingDetailsActions } from "./booking-details-actions";

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
  const t = await getTranslations({ locale, namespace: "centerBookingDetails" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function CenterBookingDetailsPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const t = await getTranslations({ locale, namespace: "centerBookingDetails" });

  // Redirect if not authenticated
  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  // Check user type
  if (
    session.user.userType !== "CENTER_OWNER" &&
    session.user.userType !== "ADMIN"
  ) {
    redirect(`/${locale}/dashboard`);
  }

  // Get user's center
  const center = await prisma.diveCenter.findFirst({
    where: { ownerId: session.user.id },
    select: { id: true },
  });

  if (!center) {
    redirect(`/${locale}/onboard/center`);
  }

  // Get booking
  const booking = await prisma.booking.findFirst({
    where: { id, centerId: center.id },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatarUrl: true,
          certificationLevel: true,
          totalDives: true,
        },
      },
      service: {
        select: {
          id: true,
          name: true,
          durationMinutes: true,
          minCertification: true,
        },
      },
      center: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
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
      confirmedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      review: {
        select: {
          id: true,
          rating: true,
          comment: true,
        },
      },
      commission: {
        select: {
          id: true,
          bookingAmount: true,
          commissionRate: true,
          commissionAmount: true,
          centerAmount: true,
          stripeFee: true,
          status: true,
          paidAt: true,
        },
      },
    },
  });

  if (!booking) {
    notFound();
  }

  // Helper functions
  const formatDate = (date: Date) =>
    new Date(date).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const formatTime = (date: Date) =>
    new Date(date).toLocaleTimeString(locale === "fr" ? "fr-FR" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatPrice = (amount: number | string | { toString(): string }) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: booking.currency,
    }).format(Number(amount));

  const clientName = booking.user
    ? `${booking.user.firstName || ""} ${booking.user.lastName || ""}`.trim() ||
      booking.user.email.split("@")[0]
    : `${booking.guestFirstName || ""} ${booking.guestLastName || ""}`.trim() ||
      booking.guestEmail.split("@")[0];

  const clientEmail = booking.user?.email || booking.guestEmail;
  const clientPhone = booking.user?.phone || booking.guestPhone;

  const serviceName = getLocalizedText(booking.service.name, locale);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/center/bookings"
          className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToBookings")}
        </Link>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">
                {t("title", { reference: booking.reference })}
              </h1>
              <BookingStatusBadge
                status={booking.status}
                translations={{
                  PENDING: t("status.PENDING"),
                  CONFIRMED: t("status.CONFIRMED"),
                  PAID: t("status.PAID"),
                  RUNNING: t("status.RUNNING"),
                  COMPLETED: t("status.COMPLETED"),
                  CANCELLED: t("status.CANCELLED"),
                  NOSHOW: t("status.NOSHOW"),
                  REMOVED: t("status.REMOVED"),
                }}
              />
            </div>
            <p className="mt-2 text-white/60">
              {t("createdAt", { date: formatDate(booking.createdAt) })}
            </p>
          </div>

          <BookingDetailsActions
            bookingId={booking.id}
            currentStatus={booking.status}
            clientEmail={clientEmail}
            reference={booking.reference}
            translations={{
              confirm: t("actions.confirm"),
              cancel: t("actions.cancel"),
              markCompleted: t("actions.markCompleted"),
              markNoShow: t("actions.markNoShow"),
              contactClient: t("actions.contactClient"),
              printDetails: t("actions.printDetails"),
            }}
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Service Details */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <Tag className="h-5 w-5 text-cyan-400" />
                {t("sections.service")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <p className="text-xl font-semibold text-cyan-300">{serviceName}</p>
                {booking.service.durationMinutes && (
                  <p className="text-sm text-white/60">
                    {t("duration", { minutes: booking.service.durationMinutes })}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-white/40" />
                  <div>
                    <p className="text-sm text-white/60">{t("labels.date")}</p>
                    <p className="text-white">{formatDate(booking.diveDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-white/40" />
                  <div>
                    <p className="text-sm text-white/60">{t("labels.time")}</p>
                    <p className="text-white">{formatTime(booking.diveTime)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-white/40" />
                  <div>
                    <p className="text-sm text-white/60">{t("labels.participants")}</p>
                    <p className="text-white">{booking.participants}</p>
                  </div>
                </div>
              </div>

              {booking.service.minCertification && (
                <div className="rounded-lg bg-amber-500/10 px-3 py-2">
                  <p className="text-sm text-amber-300">
                    {t("minCertification", { level: booking.service.minCertification })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Client Details */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <User className="h-5 w-5 text-cyan-400" />
                {t("sections.client")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-4">
                {booking.user?.avatarUrl ? (
                  <Image
                    src={booking.user.avatarUrl}
                    alt={clientName}
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/20 text-xl font-bold text-cyan-300">
                    {clientName[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-lg font-semibold text-white">{clientName}</p>
                  {booking.user && (
                    <span className="text-xs text-emerald-400">{t("registeredUser")}</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white/80">
                  <Mail className="h-4 w-4 text-white/40" />
                  <a href={`mailto:${clientEmail}`} className="hover:text-cyan-300 transition">
                    {clientEmail}
                  </a>
                </div>
                {clientPhone && (
                  <div className="flex items-center gap-2 text-white/80">
                    <Phone className="h-4 w-4 text-white/40" />
                    <a href={`tel:${clientPhone}`} className="hover:text-cyan-300 transition">
                      {clientPhone}
                    </a>
                  </div>
                )}
              </div>

              {(booking.certificationLevel || booking.user?.certificationLevel) && (
                <div className="rounded-lg bg-blue-500/10 px-3 py-2">
                  <p className="text-sm text-blue-300">
                    {t("clientCertification", {
                      level: booking.certificationLevel || booking.user?.certificationLevel || "",
                    })}
                  </p>
                  {booking.user?.totalDives !== undefined && (
                    <p className="text-xs text-blue-200/60 mt-1">
                      {t("totalDives", { count: booking.user.totalDives })}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Details */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <CreditCard className="h-5 w-5 text-cyan-400" />
                {t("sections.payment")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60">{t("labels.unitPrice")}</span>
                <span className="text-white">{formatPrice(booking.unitPrice)}</span>
              </div>
              {booking.participants > 1 && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">
                    x {booking.participants} {t("labels.participants").toLowerCase()}
                  </span>
                </div>
              )}
              {Number(booking.extrasPrice) > 0 && (
                <div className="flex justify-between">
                  <span className="text-white/60">{t("labels.extras")}</span>
                  <span className="text-white">{formatPrice(booking.extrasPrice)}</span>
                </div>
              )}
              {Number(booking.discountAmount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-white/60">{t("labels.discount")}</span>
                  <span className="text-emerald-400">-{formatPrice(booking.discountAmount)}</span>
                </div>
              )}
              <div className="border-t border-white/10 pt-3 flex justify-between">
                <span className="font-semibold text-white">{t("labels.total")}</span>
                <span className="text-xl font-bold text-emerald-400">
                  {formatPrice(booking.totalPrice)}
                </span>
              </div>

              <div className="mt-4 rounded-lg bg-white/5 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">{t("labels.paymentStatus")}</span>
                  <span
                    className={`text-sm font-medium ${
                      booking.paymentStatus === "PAID"
                        ? "text-emerald-400"
                        : booking.paymentStatus === "DEPOSIT_PAID"
                        ? "text-amber-400"
                        : "text-white/60"
                    }`}
                  >
                    {t(`paymentStatus.${booking.paymentStatus}`)}
                  </span>
                </div>
                {booking.paidAt && (
                  <p className="text-xs text-white/40 mt-1">
                    {t("paidAt", { date: formatDate(booking.paidAt) })}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Commission Details (for center) */}
          {booking.commission && (
            <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="flex items-center gap-2 text-lg text-white">
                  <TrendingUp className="h-5 w-5 text-cyan-400" />
                  {t("sections.commission")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-white/60">{t("labels.bookingAmount")}</span>
                  <span className="text-white">{formatPrice(booking.commission.bookingAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">{t("labels.commissionRate")}</span>
                  <span className="text-white">{Number(booking.commission.commissionRate)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">{t("labels.platformCommission")}</span>
                  <span className="text-red-400">-{formatPrice(booking.commission.commissionAmount)}</span>
                </div>
                {Number(booking.commission.stripeFee) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-white/60">{t("labels.stripeFee")}</span>
                    <span className="text-white/60">{formatPrice(booking.commission.stripeFee)}</span>
                  </div>
                )}
                <div className="border-t border-white/10 pt-3 flex justify-between">
                  <span className="font-semibold text-white">{t("labels.yourEarnings")}</span>
                  <span className="text-xl font-bold text-emerald-400">
                    {formatPrice(booking.commission.centerAmount)}
                  </span>
                </div>

                <div className="mt-2 rounded-lg bg-white/5 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">{t("labels.commissionStatus")}</span>
                    <span
                      className={`text-sm font-medium ${
                        booking.commission.status === "PAID"
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }`}
                    >
                      {t(`commissionStatus.${booking.commission.status}`)}
                    </span>
                  </div>
                  {booking.commission.paidAt && (
                    <p className="text-xs text-white/40 mt-1">
                      {t("commissionPaidAt", { date: formatDate(booking.commission.paidAt) })}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Info */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <FileText className="h-5 w-5 text-cyan-400" />
                {t("sections.additional")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Extras */}
              {booking.extras.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-white/60 mb-2">{t("labels.selectedExtras")}</p>
                  <div className="space-y-1">
                    {booking.extras.map((e) => (
                      <div key={e.id} className="flex justify-between text-sm">
                        <span className="text-white">
                          {getLocalizedText(e.extra.name, locale)} x{e.quantity}
                        </span>
                        <span className="text-white/60">{formatPrice(e.totalPrice)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Special Requests */}
              {booking.specialRequests && (
                <div>
                  <p className="text-sm font-medium text-white/60 mb-2">{t("labels.specialRequests")}</p>
                  <div className="rounded-lg bg-amber-500/10 px-3 py-2">
                    <p className="text-sm text-amber-200">{booking.specialRequests}</p>
                  </div>
                </div>
              )}

              {/* Source */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">{t("labels.source")}</span>
                <span
                  className={`text-sm font-medium ${
                    booking.source === "manual" ? "text-purple-400" : "text-white"
                  }`}
                >
                  {t(`sources.${booking.source}`)}
                </span>
              </div>

              {/* Coupon */}
              {booking.couponCode && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">{t("labels.couponUsed")}</span>
                  <span className="text-sm font-mono text-emerald-400">{booking.couponCode}</span>
                </div>
              )}

              {/* Confirmed By */}
              {booking.confirmedBy && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">{t("labels.confirmedBy")}</span>
                  <span className="text-sm text-white">
                    {booking.confirmedBy.firstName} {booking.confirmedBy.lastName}
                  </span>
                </div>
              )}

              {/* Cancellation */}
              {booking.status === "CANCELLED" && booking.cancellationReason && (
                <div className="rounded-lg bg-red-500/10 px-3 py-2">
                  <p className="text-sm font-medium text-red-300">{t("labels.cancellationReason")}</p>
                  <p className="text-sm text-red-200/80 mt-1">{booking.cancellationReason}</p>
                  {booking.cancelledAt && (
                    <p className="text-xs text-red-200/50 mt-1">
                      {t("cancelledAt", { date: formatDate(booking.cancelledAt) })}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Review Section */}
        {booking.review && (
          <Card className="mt-6 border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <MessageSquare className="h-5 w-5 text-cyan-400" />
                {t("sections.review")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-lg ${
                      i < booking.review!.rating ? "text-amber-400" : "text-white/20"
                    }`}
                  >
                    ★
                  </span>
                ))}
                <span className="text-white/60 ml-2">{booking.review.rating}/5</span>
              </div>
              <p className="text-white/80">{booking.review.comment}</p>
              <Link
                href={`/reviews/${booking.review.id}`}
                className="mt-3 inline-flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 transition"
              >
                {t("viewFullReview")}
                <ExternalLink className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
