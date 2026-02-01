"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Check, PartyPopper, Loader2, AlertCircle, Lock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useOnboardStore } from "@/stores/onboard-store";
import { registerAndSignInDiver, upgradeDiverProfile } from "@/app/[locale]/onboard/diver/actions";
import { cn } from "@/lib/utils";
import type { OnboardDrawerIntent } from "@/stores/onboard-store";

interface DiverReviewStepProps {
  isDrawer?: boolean;
  intent?: OnboardDrawerIntent;
  onBack?: () => void;
  onComplete?: () => void;
}

export function DiverReviewStep({
  isDrawer = false,
  intent = "register",
  onBack,
  onComplete,
}: DiverReviewStepProps) {
  const t = useTranslations("onboard.diver.review");
  const tAccount = useTranslations("onboard.diver.account");
  const tCommon = useTranslations("onboard.diver");
  const tErrors = useTranslations("onboard.diver.review.errors");
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const { diverAccount, diverPreferences, clearDiverData, _hasHydrated } = useOnboardStore();

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState("");

  const isUpgrade = intent === "upgrade";
  const needsPassword = !isUpgrade && !diverAccount?.password;

  useEffect(() => {
    if (_hasHydrated && !diverAccount?.email && !isSubmitted) {
      if (isDrawer && onBack) {
        onBack();
      } else {
        router.push(`/${locale}/onboard/diver/account`);
      }
    }
  }, [_hasHydrated, diverAccount?.email, isSubmitted, isDrawer, locale, onBack, router]);

  if (!_hasHydrated || (!diverAccount?.email && !isSubmitted)) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const password = diverAccount?.password || passwordInput;
    if (!termsAccepted || !diverAccount?.email || (!isUpgrade && !password)) {
      if (!password && needsPassword) {
        setError(t("passwordRequired"));
      }
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = isUpgrade
        ? await upgradeDiverProfile({
            certificationLevel: diverPreferences?.certificationLevel,
            certificationOrg: diverPreferences?.certificationOrg,
            totalDives: diverPreferences?.totalDives,
            preferredLanguage: diverPreferences?.preferredLanguage || locale,
          })
        : await registerAndSignInDiver(
            locale,
            {
              fullName: diverAccount.fullName!,
              email: diverAccount.email,
              phone: diverAccount.phone,
              password: password,
            },
            {
              certificationLevel: diverPreferences?.certificationLevel,
              certificationOrg: diverPreferences?.certificationOrg,
              totalDives: diverPreferences?.totalDives,
              preferredLanguage: diverPreferences?.preferredLanguage || locale,
            }
          );

      if (result.success) {
        // Clear store data
        clearDiverData();
        setIsSubmitted(true);
      } else {
        setError(tErrors("generic"));
      }
    } catch {
      setError(tErrors("generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div
        className={cn(
          "rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl",
          isDrawer && "p-6"
        )}
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-500">
          <PartyPopper className="h-10 w-10 text-white" />
        </div>
        <h2 className="mb-4 text-2xl font-bold text-white">
          {t("successTitle")}
        </h2>
        <p className="mb-8 text-white/60">{t("successDescription")}</p>
        {isDrawer && onComplete ? (
          <Button
            className="h-14 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-8 text-lg font-semibold"
            onClick={onComplete}
          >
            {t("exploreButton")}
          </Button>
        ) : (
          <Button
            className="h-14 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-8 text-lg font-semibold"
            asChild
          >
            <Link href="/explorer">{t("exploreButton")}</Link>
          </Button>
        )}
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

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Summary */}
        <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-4 font-semibold text-white">{t("summary")}</h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">{t("name")}</span>
              <span className="text-white">{diverAccount?.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">{t("emailLabel")}</span>
              <span className="text-white">{diverAccount?.email}</span>
            </div>
            {diverAccount?.phone && (
              <div className="flex justify-between">
                <span className="text-white/60">{t("phoneLabel")}</span>
                <span className="text-white">{diverAccount.phone}</span>
              </div>
            )}
            {diverPreferences?.certificationLevel && (
              <div className="flex justify-between">
                <span className="text-white/60">{t("certification")}</span>
                <span className="text-white">
                  {diverPreferences.certificationLevel}
                  {diverPreferences.certificationOrg &&
                    ` (${diverPreferences.certificationOrg})`}
                </span>
              </div>
            )}
            {(diverPreferences?.totalDives ?? 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-white/60">{t("dives")}</span>
                <span className="text-white">{diverPreferences?.totalDives}</span>
              </div>
            )}
          </div>
        </div>

        {/* Steps completion */}
        <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <span className="text-white/60">{tCommon("steps.account")}</span>
            <span className="flex items-center gap-2 text-emerald-400">
              <Check className="h-4 w-4" />
              {t("complete")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/60">{tCommon("steps.preferences")}</span>
            <span className="flex items-center gap-2 text-emerald-400">
              <Check className="h-4 w-4" />
              {t("complete")}
            </span>
          </div>
        </div>

        {/* Password confirmation */}
        {needsPassword && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
            <div className="mb-3 flex items-center gap-2 text-amber-400">
              <Lock className="h-4 w-4" />
              <span className="text-sm font-medium">{t("passwordConfirmTitle")}</span>
            </div>
            <p className="mb-4 text-sm text-white/60">{t("passwordConfirmDescription")}</p>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (error) {
                    setError(null);
                  }
                }}
                placeholder={tAccount("password")}
                className="h-12 rounded-xl border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40"
                required
              />
            </div>
          </div>
        )}

        {/* Terms */}
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500"
          />
          <span className="text-sm text-white/60">{t("termsAccept")}</span>
        </label>

        {/* Buttons */}
        <div className="flex gap-4">
          {isDrawer && onBack ? (
            <Button
              type="button"
              variant="outline"
              className="h-14 flex-1 rounded-xl border-white/20 bg-white/5 text-white"
              onClick={onBack}
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              {tCommon("steps.preferences")}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="h-14 flex-1 rounded-xl border-white/20 bg-white/5 text-white"
              asChild
            >
              <Link href="/onboard/diver/preferences">
                <ArrowLeft className="mr-2 h-5 w-5" />
                {tCommon("steps.preferences")}
              </Link>
            </Button>
          )}
          <Button
            type="submit"
            disabled={!termsAccepted || isSubmitting || (needsPassword && !passwordInput)}
            className="h-14 flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-lg font-semibold disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              t("submitButton")
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
