"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Percent, CreditCard, Shield, Zap, Globe, Check, Loader2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useOnboardStore } from "@/stores/onboard-store";
import { cn } from "@/lib/utils";

interface SellerPaymentsStepProps {
  isDrawer?: boolean;
  onNext?: () => void;
  onBack?: () => void;
}

export function SellerPaymentsStep({
  isDrawer = false,
  onNext,
  onBack,
}: SellerPaymentsStepProps) {
  const t = useTranslations("onboard.seller.payments");
  const tCommon = useTranslations("onboard.seller");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { sellerAccount, sellerProfile, sellerServices, _hasHydrated } = useOnboardStore();
  const [isConnected, setIsConnected] = useState(false);

  const handleStripeConnect = () => {
    // Simulate Stripe Connect
    setIsConnected(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onNext) {
      onNext();
    } else {
      router.push(`/${locale}/onboard/seller/review`);
    }
  };

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!sellerAccount?.email || !sellerProfile?.bio || sellerServices.length === 0) {
      if (isDrawer && onBack) {
        onBack();
        return;
      }
      if (!sellerAccount?.email) {
        router.push(`/${locale}/onboard/seller/account`);
        return;
      }
      if (!sellerProfile?.bio) {
        router.push(`/${locale}/onboard/seller/profile`);
        return;
      }
      if (sellerServices.length === 0) {
        router.push(`/${locale}/onboard/seller/services`);
      }
    }
  }, [
    _hasHydrated,
    sellerAccount?.email,
    sellerProfile?.bio,
    sellerServices.length,
    isDrawer,
    locale,
    onBack,
    router,
  ]);

  if (!_hasHydrated || !sellerAccount?.email || !sellerProfile?.bio || sellerServices.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl",
        isDrawer && "p-6"
      )}
    >
      <p className="mb-8 text-center text-white/60">{t("description")}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Commission Info */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30">
              <Percent className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">{t("commissionTitle")}</h3>
              <p className="text-sm text-white/60">{t("commissionDescription")}</p>
            </div>
          </div>
          <div className="text-center">
            <span className="text-4xl font-bold text-white">11%</span>
            <span className="ml-2 text-white/60">{t("perBooking")}</span>
          </div>
        </div>

        {/* Stripe Connect */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30">
              <CreditCard className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">{t("stripeConnect")}</h3>
              <p className="text-sm text-white/60">{t("stripeDescription")}</p>
            </div>
          </div>

          {isConnected ? (
            <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/20 py-4 text-emerald-400">
              <Check className="h-5 w-5" />
              {t("connected")}
            </div>
          ) : (
            <Button
              type="button"
              onClick={handleStripeConnect}
              className="h-14 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-lg font-semibold"
            >
              {t("connectButton")}
            </Button>
          )}
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Shield, key: "secure" },
            { icon: Zap, key: "fast" },
            { icon: Globe, key: "global" },
          ].map(({ icon: Icon, key }) => (
            <div key={key} className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <Icon className="mx-auto mb-2 h-6 w-6 text-emerald-400" />
              <div className="text-sm font-medium text-white">
                {t(`benefits.${key}.title`)}
              </div>
              <div className="mt-1 text-xs text-white/50">
                {t(`benefits.${key}.description`)}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          {isDrawer && onBack ? (
            <Button
              type="button"
              variant="outline"
              className="h-14 flex-1 rounded-xl border-white/20 bg-white/5 text-white"
              onClick={onBack}
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              {tCommon("steps.services")}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="h-14 flex-1 rounded-xl border-white/20 bg-white/5 text-white"
              asChild
            >
              <Link href="/onboard/seller/services">
                <ArrowLeft className="mr-2 h-5 w-5" />
                {tCommon("steps.services")}
              </Link>
            </Button>
          )}
          <Button
            type="submit"
            className="h-14 flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-lg font-semibold"
          >
            {tCommon("steps.review")}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
