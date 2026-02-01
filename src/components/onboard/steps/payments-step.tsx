"use client";

import { useTranslations } from "next-intl";
import { CreditCard, Lock, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CenterPaymentsStepProps {
  isDrawer?: boolean;
  onNext?: () => void;
  onBack?: () => void;
}

export function PaymentsStep({ onNext, onBack }: CenterPaymentsStepProps) {
  const t = useTranslations("onboard.center.payments");

  return (
    <div className="space-y-6">
      <p className="text-white/60">{t("description")}</p>

      {/* Commission info */}
      <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-6">
        <h3 className="mb-2 font-semibold text-cyan-400">{t("commissionTitle")}</h3>
        <p className="text-sm text-white/70">{t("commissionDescription")}</p>
        <div className="mt-4 flex items-center gap-4">
          <div className="text-3xl font-bold text-white">11%</div>
          <div className="text-sm text-white/50">{t("perBooking")}</div>
        </div>
      </div>

      {/* Stripe Connect */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/30">
            <CreditCard className="h-6 w-6 text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="mb-1 font-semibold text-white">{t("stripeConnect")}</h3>
            <p className="text-sm text-white/60">{t("stripeDescription")}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <Lock className="h-4 w-4 shrink-0" />
          <span>{t("comingSoon")}</span>
        </div>
      </div>

      {/* Benefits */}
      <div className="grid gap-4 md:grid-cols-3">
        {["secure", "fast", "global"].map((benefit) => (
          <div
            key={benefit}
            className="rounded-xl border border-white/10 bg-white/5 p-4 text-center"
          >
            <h4 className="mb-1 font-medium text-white">{t(`benefits.${benefit}.title`)}</h4>
            <p className="text-sm text-white/50">{t(`benefits.${benefit}.description`)}</p>
          </div>
        ))}
      </div>

      {onBack || onNext ? (
        <div className="flex gap-4">
          {onBack ? (
            <Button
              type="button"
              variant="outline"
              className="h-12 flex-1 rounded-xl border-white/20 bg-white/5 text-white"
              onClick={onBack}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("back")}
            </Button>
          ) : null}
          {onNext ? (
            <Button
              type="button"
              className="h-12 flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-sm font-semibold"
              onClick={onNext}
            >
              {t("continue")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
