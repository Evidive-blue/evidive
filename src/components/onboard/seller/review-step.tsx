"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Check, PartyPopper, Loader2, AlertCircle, Lock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useOnboardStore } from "@/stores/onboard-store";
import { registerSeller, upgradeSeller } from "@/app/[locale]/onboard/seller/actions";
import { cn } from "@/lib/utils";
import type { OnboardDrawerIntent } from "@/stores/onboard-store";

interface SellerReviewStepProps {
  isDrawer?: boolean;
  intent?: OnboardDrawerIntent;
  onBack?: () => void;
  onComplete?: () => void;
}

export function SellerReviewStep({
  isDrawer = false,
  intent = "register",
  onBack,
  onComplete,
}: SellerReviewStepProps) {
  const t = useTranslations("onboard.seller.review");
  const tAccount = useTranslations("onboard.seller.account");
  const tCommon = useTranslations("onboard.seller");
  const tErrors = useTranslations("onboard.seller.review.errors");
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const { sellerAccount, sellerProfile, sellerServices, clearSellerData, _hasHydrated } = useOnboardStore();

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState("");

  const isUpgrade = intent === "upgrade";
  const needsPassword = !isUpgrade && !sellerAccount?.password;

  useEffect(() => {
    if (_hasHydrated && !sellerAccount?.email && !isSubmitted) {
      if (isDrawer && onBack) {
        onBack();
      } else {
        router.push(`/${locale}/onboard/seller/account`);
      }
    }
  }, [_hasHydrated, sellerAccount?.email, isSubmitted, isDrawer, locale, onBack, router]);

  if (!_hasHydrated || (!sellerAccount?.email && !isSubmitted)) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const password = sellerAccount?.password || passwordInput;
    if (!termsAccepted || !sellerAccount?.email || (!isUpgrade && !password)) {
      if (!password && needsPassword) {
        setError(t("passwordRequired"));
      }
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = isUpgrade
        ? await upgradeSeller(
            {
              fullName: sellerAccount.fullName!,
              email: sellerAccount.email,
              phone: sellerAccount.phone,
            },
            {
              bio: sellerProfile?.bio || "",
              certifications: sellerProfile?.certifications || [],
              languages: sellerProfile?.languages || [locale],
              photoUrl: sellerProfile?.photoUrl,
            },
            sellerServices.map((s) => ({
              name: s.name,
              description: s.description,
              price: s.price,
              duration: s.duration,
              maxParticipants: s.maxParticipants,
            }))
          )
        : await registerSeller(
            locale,
            {
              fullName: sellerAccount.fullName!,
              email: sellerAccount.email,
              phone: sellerAccount.phone,
              password: password,
            },
            {
              bio: sellerProfile?.bio || "",
              certifications: sellerProfile?.certifications || [],
              languages: sellerProfile?.languages || [locale],
              photoUrl: sellerProfile?.photoUrl,
            },
            sellerServices.map((s) => ({
              name: s.name,
              description: s.description,
              price: s.price,
              duration: s.duration,
              maxParticipants: s.maxParticipants,
            }))
          );

      if (result.success) {
        clearSellerData();
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
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500">
          <PartyPopper className="h-10 w-10 text-white" />
        </div>
        <h2 className="mb-4 text-2xl font-bold text-white">
          {t("successTitle")}
        </h2>
        <p className="mb-8 text-white/60">{t("successDescription")}</p>
        {isDrawer && onComplete ? (
          <Button
            className="h-14 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 text-lg font-semibold"
            onClick={onComplete}
          >
            {t("homeButton")}
          </Button>
        ) : (
          <Button
            className="h-14 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 text-lg font-semibold"
            asChild
          >
            <Link href="/">{t("homeButton")}</Link>
          </Button>
        )}
      </div>
    );
  }

  const sections = [
    { key: "account", complete: !!sellerAccount?.email },
    { key: "profile", complete: !!sellerProfile?.bio },
    { key: "services", complete: sellerServices.length > 0 },
    { key: "payments", complete: true }, // Payments step is optional for now
  ];

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
          <h3 className="font-semibold text-white">{t("summary")}</h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">{t("name")}</span>
              <span className="text-white">{sellerAccount?.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">{t("emailLabel")}</span>
              <span className="text-white">{sellerAccount?.email}</span>
            </div>
            {sellerProfile?.certifications && sellerProfile.certifications.length > 0 && (
              <div className="flex justify-between">
                <span className="text-white/60">{t("certifications")}</span>
                <span className="text-white">{sellerProfile.certifications.join(", ")}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-white/60">{t("servicesCount")}</span>
              <span className="text-white">{sellerServices.length}</span>
            </div>
          </div>
        </div>

        {/* Steps completion */}
        <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-6">
          {sections.map(({ key, complete }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-white/60">{tCommon(`steps.${key}`)}</span>
              <span className={`flex items-center gap-2 ${complete ? "text-emerald-400" : "text-yellow-400"}`}>
                <Check className="h-4 w-4" />
                {complete ? t("complete") : t("incomplete")}
              </span>
            </div>
          ))}
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
            className="mt-1 h-5 w-5 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500"
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
              {tCommon("steps.payments")}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="h-14 flex-1 rounded-xl border-white/20 bg-white/5 text-white"
              asChild
            >
              <Link href="/onboard/seller/payments">
                <ArrowLeft className="mr-2 h-5 w-5" />
                {tCommon("steps.payments")}
              </Link>
            </Button>
          )}
          <Button
            type="submit"
            disabled={!termsAccepted || isSubmitting || (needsPassword && !passwordInput)}
            className="h-14 flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-lg font-semibold disabled:opacity-50"
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
