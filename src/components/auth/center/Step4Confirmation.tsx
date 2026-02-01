"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  User,
  Building2,
  MapPin,
  Award,
  FileText,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { LiquidInput } from "@/components/ui/liquid-input";
import { useCenterRegistrationStore } from "@/stores/centerRegistrationStore";
import { createCenterApplication } from "@/app/[locale]/register/center/actions";

interface Step4ConfirmationProps {
  onBack: () => void;
}

export function Step4Confirmation({ onBack }: Step4ConfirmationProps) {
  const t = useTranslations("centerRegistration.step4");
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const {
    personalInfo,
    centerInfo,
    legalInfo,
    termsAccepted,
    setTermsAccepted,
    resetStore,
    _hasHydrated,
  } = useCenterRegistrationStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState("");

  // Password is not persisted for security - require re-entry
  const needsPassword = !personalInfo.password;

  // Redirect if no data
  useEffect(() => {
    if (_hasHydrated && !personalInfo.email) {
      router.push(`/${locale}/register/center`);
    }
  }, [_hasHydrated, personalInfo.email, router, locale]);

  if (!_hasHydrated || !personalInfo.email) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  const handleSubmit = async () => {
    const password = personalInfo.password || passwordInput;
    if (!termsAccepted) {
      setError(t("errors.termsRequired"));
      return;
    }
    if (!password) {
      setError(t("errors.passwordRequired"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createCenterApplication(locale, {
        // Personal info
        firstName: personalInfo.firstName!,
        lastName: personalInfo.lastName!,
        email: personalInfo.email!,
        password: password,
        phone: personalInfo.phone!,
        // Center info
        centerName: {
          fr: centerInfo.centerName?.fr || "",
          en: centerInfo.centerName?.en || "",
        },
        street: centerInfo.street || "",
        city: centerInfo.city || "",
        postalCode: centerInfo.postalCode,
        country: centerInfo.country || "",
        latitude: centerInfo.latitude!,
        longitude: centerInfo.longitude!,
        website: centerInfo.website,
        shortDescription: {
          fr: centerInfo.shortDescription?.fr || "",
          en: centerInfo.shortDescription?.en || "",
        },
        // Legal info
        companyName: legalInfo.companyName,
        siretOrVat: legalInfo.siretOrVat,
        certifications: legalInfo.certifications || [],
        // Terms
        termsAccepted: true,
      });

      if (result.success) {
        resetStore();
        router.push(`/${locale}/register/center/success`);
      } else {
        if (result.errorCode === "EMAIL_EXISTS") {
          setError(t("errors.emailExists"));
        } else if (result.errorCode === "RATE_LIMIT") {
          setError(t("errors.rateLimit"));
        } else if (result.errorCode === "VALIDATION") {
          setError(t("errors.validation"));
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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-white">{t("title")}</h2>
        <p className="text-sm text-white/60">{t("description")}</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Summary */}
      <div className="space-y-4">
        {/* Personal Info */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center gap-2 text-cyan-400">
            <User className="h-4 w-4" />
            <span className="text-sm font-medium">{t("sections.personal")}</span>
            <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-400" />
          </div>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">{t("labels.name")}</span>
              <span className="text-white">{personalInfo.firstName} {personalInfo.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">{t("labels.email")}</span>
              <span className="text-white">{personalInfo.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">{t("labels.phone")}</span>
              <span className="text-white">{personalInfo.phone}</span>
            </div>
          </div>
        </div>

        {/* Center Info */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center gap-2 text-cyan-400">
            <Building2 className="h-4 w-4" />
            <span className="text-sm font-medium">{t("sections.center")}</span>
            <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-400" />
          </div>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">{t("labels.centerName")}</span>
              <span className="text-white">{centerInfo.centerName?.fr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">{t("labels.website")}</span>
              <span className="text-white">{centerInfo.website || "-"}</span>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center gap-2 text-cyan-400">
            <MapPin className="h-4 w-4" />
            <span className="text-sm font-medium">{t("sections.location")}</span>
            <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-400" />
          </div>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">{t("labels.address")}</span>
              <span className="text-right text-white">
                {centerInfo.street}, {centerInfo.city}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">{t("labels.country")}</span>
              <span className="text-white">{centerInfo.country}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">{t("labels.coordinates")}</span>
              <span className="text-white">
                {centerInfo.latitude?.toFixed(4)}, {centerInfo.longitude?.toFixed(4)}
              </span>
            </div>
          </div>
        </div>

        {/* Legal Info */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center gap-2 text-cyan-400">
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">{t("sections.legal")}</span>
            <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-400" />
          </div>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/60">{t("labels.company")}</span>
              <span className="text-white">{legalInfo.companyName || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">{t("labels.siretVat")}</span>
              <span className="text-white">{legalInfo.siretOrVat || "-"}</span>
            </div>
          </div>
        </div>

        {/* Certifications */}
        {legalInfo.certifications && legalInfo.certifications.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center gap-2 text-cyan-400">
              <Award className="h-4 w-4" />
              <span className="text-sm font-medium">{t("sections.certifications")}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {legalInfo.certifications.map((cert) => (
                <span
                  key={cert}
                  className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-medium text-cyan-400"
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Password re-entry (if needed) */}
      {needsPassword && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
          <div className="mb-3 flex items-center gap-2 text-amber-400">
            <Lock className="h-4 w-4" />
            <span className="text-sm font-medium">{t("passwordConfirmTitle")}</span>
          </div>
          <p className="mb-4 text-sm text-white/60">{t("passwordConfirmDescription")}</p>
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
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/50"
          />
          <span className="text-sm text-white/70">
            {t("termsText")}{" "}
            <Link href="/legal/terms" className="text-cyan-400 hover:underline">
              {t("termsLink")}
            </Link>{" "}
            {t("and")}{" "}
            <Link href="/legal/privacy" className="text-cyan-400 hover:underline">
              {t("privacyLink")}
            </Link>
          </span>
        </label>
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 rounded-xl border border-white/20 bg-white/5 px-6 py-4 font-semibold text-white transition-all hover:bg-white/10 disabled:opacity-50"
        >
          {t("back")}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !termsAccepted || (needsPassword && !passwordInput)}
          className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-4 font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          ) : (
            t("submit")
          )}
        </button>
      </div>
    </div>
  );
}
