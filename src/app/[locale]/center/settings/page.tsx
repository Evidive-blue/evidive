import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Users, AlertTriangle } from "lucide-react";
import {
  NotificationToggles,
  CancellationPolicyEditor,
  StripeConnectStatus,
  DeactivateCenterModal,
  DeleteCenterModal,
} from "@/components/center/settings";
import { Button } from "@/components/ui/button";

type LocalizedJson = Record<string, unknown>;

function getLocalizedText(value: unknown, locale: string): string {
  if (!value || typeof value !== "object") return "";

  const obj = value as LocalizedJson;
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
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "centerSettings" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function CenterSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  const t = await getTranslations({ locale, namespace: "centerSettings" });

  // Redirect if not authenticated
  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  // Check if user is CENTER_OWNER or ADMIN
  const userType = session.user.userType;
  if (userType !== "CENTER_OWNER" && userType !== "ADMIN") {
    redirect(`/${locale}/dashboard`);
  }

  // Find the user's center with settings
  const center = await prisma.diveCenter.findFirst({
    where: { ownerId: session.user.id },
    select: {
      id: true,
      slug: true,
      name: true,
      status: true,
      phone: true,
      // Notifications
      emailOnNewBooking: true,
      emailOnCancellation: true,
      emailOnNewReview: true,
      smsOnNewBooking: true,
      dailyBookingReminder: true,
      // Cancellation
      cancellationPolicy: true,
      cancellationHours: true,
      partialRefundPercent: true,
      // Payment
      stripeAccountId: true,
      iban: true,
      commissionRate: true,
    },
  });

  // If no center found, redirect to center creation
  if (!center) {
    redirect(`/${locale}/onboard/center`);
  }

  // If center is not approved, show a pending status message
  if (center.status === "PENDING" || center.status === "REJECTED") {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-8 backdrop-blur-xl">
            <h1 className="text-2xl font-bold text-amber-200">
              {t("pendingApproval.title")}
            </h1>
            <p className="mt-4 text-amber-200/80">
              {t("pendingApproval.description")}
            </p>
            <div className="mt-6">
              <Link
                href="/center"
                className="inline-block rounded-xl bg-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/20"
              >
                {t("backToDashboard")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const centerName = getLocalizedText(center.name, locale) || "Mon centre";
  const isSuspended = center.status === "SUSPENDED";
  const hasPhone = Boolean(center.phone);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/center"
          className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToDashboard")}
        </Link>

        {/* Header */}
        <div className="mt-6">
          <h1 className="text-3xl font-bold text-white">{t("title")}</h1>
          <p className="mt-2 text-white/60">
            {t("subtitle", { centerName })}
          </p>
        </div>

        {/* Suspended warning */}
        {isSuspended && (
          <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <div>
                <h3 className="font-semibold text-amber-200">
                  {t("suspendedWarning.title")}
                </h3>
                <p className="mt-1 text-sm text-amber-200/80">
                  {t("suspendedWarning.description")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Settings Sections */}
        <div className="mt-8 space-y-8">
          {/* 1. Notifications */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <NotificationToggles
              centerId={center.id}
              initialValues={{
                emailOnNewBooking: center.emailOnNewBooking,
                emailOnCancellation: center.emailOnCancellation,
                emailOnNewReview: center.emailOnNewReview,
                smsOnNewBooking: center.smsOnNewBooking,
                dailyBookingReminder: center.dailyBookingReminder,
              }}
              hasPhone={hasPhone}
              translations={{
                title: t("notifications.title"),
                emailOnNewBooking: t("notifications.emailOnNewBooking"),
                emailOnNewBookingDesc: t("notifications.emailOnNewBookingDesc"),
                emailOnCancellation: t("notifications.emailOnCancellation"),
                emailOnCancellationDesc: t(
                  "notifications.emailOnCancellationDesc"
                ),
                emailOnNewReview: t("notifications.emailOnNewReview"),
                emailOnNewReviewDesc: t("notifications.emailOnNewReviewDesc"),
                smsOnNewBooking: t("notifications.smsOnNewBooking"),
                smsOnNewBookingDesc: t("notifications.smsOnNewBookingDesc"),
                smsRequiresPhone: t("notifications.smsRequiresPhone"),
                dailyBookingReminder: t("notifications.dailyBookingReminder"),
                dailyBookingReminderDesc: t(
                  "notifications.dailyBookingReminderDesc"
                ),
                saved: t("saved"),
                error: t("error"),
              }}
            />
          </section>

          {/* 2. Cancellation Policy */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <CancellationPolicyEditor
              centerId={center.id}
              initialValues={{
                cancellationPolicy: center.cancellationPolicy,
                cancellationHours: center.cancellationHours,
                partialRefundPercent: center.partialRefundPercent,
              }}
              translations={{
                title: t("cancellation.title"),
                policyLabel: t("cancellation.policyLabel"),
                flexible: t("cancellation.flexible"),
                flexibleDesc: t("cancellation.flexibleDesc"),
                moderate: t("cancellation.moderate"),
                moderateDesc: t("cancellation.moderateDesc"),
                strict: t("cancellation.strict"),
                strictDesc: t("cancellation.strictDesc"),
                hoursLabel: t("cancellation.hoursLabel"),
                hoursDesc: t("cancellation.hoursDesc"),
                refundLabel: t("cancellation.refundLabel"),
                refundDesc: t("cancellation.refundDesc"),
                save: t("save"),
                saving: t("saving"),
                saved: t("saved"),
                error: t("error"),
                invalidHours: t("cancellation.invalidHours"),
                invalidRefund: t("cancellation.invalidRefund"),
              }}
            />
          </section>

          {/* 3. Payment / Stripe */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <StripeConnectStatus
              centerId={center.id}
              stripeAccountId={center.stripeAccountId}
              iban={center.iban}
              commissionRate={Number(center.commissionRate)}
              translations={{
                title: t("payment.title"),
                stripeConnected: t("payment.stripeConnected"),
                stripeNotConnected: t("payment.stripeNotConnected"),
                stripeConnectedDesc: t("payment.stripeConnectedDesc"),
                stripeNotConnectedDesc: t("payment.stripeNotConnectedDesc"),
                connectStripe: t("payment.connectStripe"),
                manageStripe: t("payment.manageStripe"),
                comingSoon: t("payment.comingSoon"),
                ibanTitle: t("payment.ibanTitle"),
                ibanLabel: t("payment.ibanLabel"),
                ibanDesc: t("payment.ibanDesc"),
                ibanPlaceholder: t("payment.ibanPlaceholder"),
                save: t("save"),
                saving: t("saving"),
                saved: t("saved"),
                error: t("error"),
                invalidIban: t("payment.invalidIban"),
                commissionTitle: t("payment.commissionTitle"),
                commissionDesc: t("payment.commissionDesc"),
                commissionReadOnly: t("payment.commissionReadOnly"),
              }}
            />
          </section>

          {/* 4. Team link */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {t("team.title")}
                  </h2>
                  <p className="text-sm text-white/60">{t("team.description")}</p>
                </div>
              </div>
              <Button asChild variant="outline" className="border-white/20">
                <Link href="/center/team">{t("team.manage")}</Link>
              </Button>
            </div>
          </section>

          {/* 5. Danger Zone */}
          <section className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-red-400">
                {t("danger.title")}
              </h2>
            </div>

            <p className="mt-4 text-sm text-white/60">{t("danger.description")}</p>

            <div className="mt-6 flex flex-wrap gap-4">
              <DeactivateCenterModal
                centerId={center.id}
                isSuspended={isSuspended}
                translations={{
                  deactivateTitle: t("danger.deactivate.title"),
                  deactivateDescription: t("danger.deactivate.description"),
                  deactivateButton: t("danger.deactivate.button"),
                  reactivateTitle: t("danger.reactivate.title"),
                  reactivateDescription: t("danger.reactivate.description"),
                  reactivateButton: t("danger.reactivate.button"),
                  cancel: t("cancel"),
                  confirm: t("confirm"),
                  confirming: t("confirming"),
                  success: t("danger.deactivate.success"),
                  reactivateSuccess: t("danger.reactivate.success"),
                  error: t("error"),
                }}
              />

              <DeleteCenterModal
                centerId={center.id}
                centerSlug={center.slug}
                translations={{
                  title: t("danger.delete.title"),
                  description: t("danger.delete.description"),
                  warningTitle: t("danger.delete.warningTitle"),
                  warningItems: [
                    t("danger.delete.warning1"),
                    t("danger.delete.warning2"),
                    t("danger.delete.warning3"),
                  ],
                  confirmLabel: t("danger.delete.confirmLabel"),
                  confirmPlaceholder: t("danger.delete.confirmPlaceholder"),
                  confirmHint: t("danger.delete.confirmHint"),
                  deleteButton: t("danger.delete.button"),
                  cancel: t("cancel"),
                  confirm: t("danger.delete.confirmButton"),
                  deleting: t("danger.delete.deleting"),
                  success: t("danger.delete.success"),
                  error: t("error"),
                  mismatch: t("danger.delete.mismatch"),
                  hasActiveBookings: t("danger.delete.hasActiveBookings"),
                }}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
