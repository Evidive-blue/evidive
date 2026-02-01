"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Save,
  Loader2,
  Building,
} from "lucide-react";
import { updateCenterIban, getStripeOnboardingLink } from "@/actions/center-settings";

interface StripeConnectStatusProps {
  centerId: string;
  stripeAccountId: string | null;
  iban: string | null;
  commissionRate: number;
  translations: {
    title: string;
    stripeConnected: string;
    stripeNotConnected: string;
    stripeConnectedDesc: string;
    stripeNotConnectedDesc: string;
    connectStripe: string;
    manageStripe: string;
    comingSoon: string;
    ibanTitle: string;
    ibanLabel: string;
    ibanDesc: string;
    ibanPlaceholder: string;
    save: string;
    saving: string;
    saved: string;
    error: string;
    invalidIban: string;
    commissionTitle: string;
    commissionDesc: string;
    commissionReadOnly: string;
  };
}

export function StripeConnectStatus({
  centerId,
  stripeAccountId,
  iban: initialIban,
  commissionRate,
  translations: t,
}: StripeConnectStatusProps) {
  const [isPending, startTransition] = useTransition();
  const [iban, setIban] = useState(initialIban || "");
  const [hasIbanChanges, setHasIbanChanges] = useState(false);

  const isStripeConnected = Boolean(stripeAccountId);

  const handleStripeConnect = () => {
    startTransition(async () => {
      const result = await getStripeOnboardingLink(centerId);

      if (result.ok && result.url) {
        window.open(result.url, "_blank");
      } else if (result.error === "stripe_coming_soon") {
        toast.info(t.comingSoon);
      } else {
        toast.error(t.error);
      }
    });
  };

  const handleIbanChange = (value: string) => {
    // Format IBAN with spaces every 4 characters
    const cleaned = value.replace(/\s/g, "").toUpperCase();
    const formatted = cleaned.replace(/(.{4})/g, "$1 ").trim();
    setIban(formatted);
    setHasIbanChanges(true);
  };

  const handleSaveIban = () => {
    startTransition(async () => {
      const result = await updateCenterIban(centerId, iban || null);

      if (result.ok) {
        toast.success(t.saved);
        setHasIbanChanges(false);
      } else if (result.error === "invalid_iban") {
        toast.error(t.invalidIban);
      } else {
        toast.error(t.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20">
          <CreditCard className="h-5 w-5 text-violet-400" />
        </div>
        <h2 className="text-xl font-semibold text-white">{t.title}</h2>
      </div>

      {/* Stripe Connect Status */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${
              isStripeConnected ? "bg-green-500/20" : "bg-amber-500/20"
            }`}
          >
            {isStripeConnected ? (
              <CheckCircle className="h-6 w-6 text-green-400" />
            ) : (
              <AlertCircle className="h-6 w-6 text-amber-400" />
            )}
          </div>
          <div className="flex-1">
            <h3
              className={`font-semibold ${
                isStripeConnected ? "text-green-400" : "text-amber-400"
              }`}
            >
              {isStripeConnected ? t.stripeConnected : t.stripeNotConnected}
            </h3>
            <p className="mt-1 text-sm text-white/60">
              {isStripeConnected
                ? t.stripeConnectedDesc
                : t.stripeNotConnectedDesc}
            </p>
            <Button
              onClick={handleStripeConnect}
              disabled={isPending}
              variant="outline"
              className="mt-4 border-white/20 text-white hover:bg-white/10"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              {isStripeConnected ? t.manageStripe : t.connectStripe}
            </Button>
          </div>
        </div>
      </div>

      {/* IBAN (optional) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-cyan-400" />
          <h3 className="font-semibold text-white">{t.ibanTitle}</h3>
        </div>
        <div className="space-y-2">
          <Label className="text-white">{t.ibanLabel}</Label>
          <div className="flex gap-2">
            <Input
              value={iban}
              onChange={(e) => handleIbanChange(e.target.value)}
              placeholder={t.ibanPlaceholder}
              className="border-white/20 bg-white/5 font-mono text-white"
              maxLength={42}
            />
            {hasIbanChanges && (
              <Button
                onClick={handleSaveIban}
                disabled={isPending}
                className="bg-cyan-500 hover:bg-cyan-600"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
          <p className="text-sm text-white/60">{t.ibanDesc}</p>
        </div>
      </div>

      {/* Commission Rate (Read-only) */}
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4">
        <h3 className="font-semibold text-cyan-200">{t.commissionTitle}</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">
            {commissionRate}%
          </span>
          <span className="text-white/60">{t.commissionDesc}</span>
        </div>
        <p className="mt-2 text-sm text-cyan-200/60">{t.commissionReadOnly}</p>
      </div>
    </div>
  );
}
