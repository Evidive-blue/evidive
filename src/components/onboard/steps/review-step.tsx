"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { CheckCircle2, Building2, MapPin, FileText, CreditCard, Loader2, AlertCircle, Lock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useOnboardStore } from "@/stores/onboard-store";
import { registerCenter, upgradeCenter } from "@/app/[locale]/onboard/center/actions";
import { LiquidInput } from "@/components/ui/liquid-input";
import type { OnboardDrawerIntent } from "@/stores/onboard-store";

interface CenterReviewStepProps {
  isDrawer?: boolean;
  intent?: OnboardDrawerIntent;
  onBack?: () => void;
  onComplete?: () => void;
}

export function ReviewStep({
  isDrawer = false,
  intent = "register",
  onBack,
  onComplete,
}: CenterReviewStepProps) {
  const t = useTranslations("onboard.center.review");
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const { centerAccount, centerInfo, centerLocation, clearCenterData, _hasHydrated } = useOnboardStore();

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState("");

  // Check if password is missing (not persisted for security)
  const isUpgrade = intent === "upgrade";
  const needsPassword = !isUpgrade && !centerAccount?.password;

  // Handle redirect client-side only after hydration
  useEffect(() => {
    if (_hasHydrated && !centerAccount?.email && !isSubmitted) {
      if (isDrawer && onBack) {
        onBack();
      } else {
        router.push("/onboard/center/account");
      }
    }
  }, [_hasHydrated, centerAccount?.email, isDrawer, isSubmitted, onBack, router]);

  // Show loading while hydrating or if no data
  if (!_hasHydrated || (!centerAccount?.email && !isSubmitted)) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  const sections = [
    { key: "account", icon: <CheckCircle2 className="h-5 w-5" />, complete: !!centerAccount?.email },
    { key: "info", icon: <Building2 className="h-5 w-5" />, complete: !!centerInfo?.centerName },
    {
      key: "location",
      icon: <MapPin className="h-5 w-5" />,
      complete:
        !!centerLocation?.address &&
        typeof centerLocation.latitude === "number" &&
        typeof centerLocation.longitude === "number",
    },
    { key: "documents", icon: <FileText className="h-5 w-5" />, complete: false },
    { key: "payments", icon: <CreditCard className="h-5 w-5" />, complete: false },
  ];

  const handleSubmit = async () => {
    const password = centerAccount?.password || passwordInput;
    if (!termsAccepted || !centerAccount?.email || (!isUpgrade && !password)) {
      if (!password && needsPassword) {
        setError(t("passwordRequired"));
      }
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = isUpgrade
        ? await upgradeCenter(
            {
              fullName: centerAccount.fullName!,
              email: centerAccount.email,
              phone: centerAccount.phone,
            },
            {
              centerName: centerInfo?.centerName || "",
              description: centerInfo?.description || "",
              website: centerInfo?.website,
              facebook: centerInfo?.facebook,
              instagram: centerInfo?.instagram,
            },
            {
              address: centerLocation?.address || "",
              city: centerLocation?.city || "",
              postalCode: centerLocation?.postalCode,
              country: centerLocation?.country || "",
              latitude: centerLocation?.latitude,
              longitude: centerLocation?.longitude,
            }
          )
        : await registerCenter(
            locale,
            {
              fullName: centerAccount.fullName!,
              email: centerAccount.email,
              phone: centerAccount.phone,
              password: password,
            },
            {
              centerName: centerInfo?.centerName || "",
              description: centerInfo?.description || "",
              website: centerInfo?.website,
              facebook: centerInfo?.facebook,
              instagram: centerInfo?.instagram,
            },
            {
              address: centerLocation?.address || "",
              city: centerLocation?.city || "",
              postalCode: centerLocation?.postalCode,
              country: centerLocation?.country || "",
              latitude: centerLocation?.latitude,
              longitude: centerLocation?.longitude,
            }
          );

      if (result.success) {
        clearCenterData();
        setIsSubmitted(true);
      } else {
        if (result.errorCode === "EMAIL_ALREADY_REGISTERED") {
          setError(t("errors.emailAlreadyRegistered"));
        } else if (result.errorCode === "VALIDATION_FAILED") {
          setError(t("errors.validationFailed"));
        } else {
          setError(t("errors.generic"));
        }
      }
    } catch {
      setError(t("errors.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20">
          <CheckCircle2 className="h-10 w-10 text-emerald-400" />
        </div>
        <h2 className="mb-4 text-2xl font-bold text-white">{t("successTitle")}</h2>
        <p className="mx-auto mb-8 max-w-md text-white/60">{t("successDescription")}</p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard/center"
            onClick={onComplete}
            className="inline-block rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-4 font-semibold text-white"
          >
            {t("dashboardButton")}
          </Link>
          <Link
            href="/"
            onClick={onComplete}
            className="inline-block rounded-xl border border-white/10 bg-white/5 px-8 py-4 font-semibold text-white/90 backdrop-blur-xl transition hover:bg-white/10"
          >
            {t("homeButton")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-white/60">{t("description")}</p>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Summary */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="mb-4 font-semibold text-white">{t("summary")}</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-white/60">{t("name")}</span>
            <span className="text-white">{centerAccount?.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">{t("emailLabel")}</span>
            <span className="text-white">{centerAccount?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">{t("centerName")}</span>
            <span className="text-white">{centerInfo?.centerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">{t("locationLabel")}</span>
            <span className="text-white">{centerLocation?.city}, {centerLocation?.country}</span>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="space-y-4">
        {sections.map(({ key, icon, complete }) => (
          <div
            key={key}
            className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
              {icon}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-white">{t(`sections.${key}`)}</h4>
              <p className="text-sm text-white/50">
                {complete ? t(`sections.${key}Status`) : t("incomplete")}
              </p>
            </div>
            <CheckCircle2 className={`h-5 w-5 ${complete ? "text-emerald-400" : "text-white/20"}`} />
          </div>
        ))}
      </div>

      {/* Password re-entry (if needed) */}
      {needsPassword && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
          <div className="mb-3 flex items-center gap-2 text-amber-400">
            <Lock className="h-4 w-4" />
            <span className="text-sm font-medium">{t("passwordConfirmTitle")}</span>
          </div>
          <p className="mb-4 text-sm text-white/60">
            {t("passwordConfirmDescription")}
          </p>
          <LiquidInput
            type="password"
            label={t("passwordLabel")}
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            required
          />
        </div>
      )}

      {/* Terms */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/50"
          />
          <span className="text-sm text-white/70">{t("termsAccept")}</span>
        </label>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !termsAccepted || (needsPassword && !passwordInput)}
        className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-4 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isSubmitting ? (
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        ) : (
          t("submitButton")
        )}
      </button>
    </div>
  );
}
