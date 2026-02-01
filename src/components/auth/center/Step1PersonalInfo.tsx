"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { LiquidInput } from "@/components/ui/liquid-input";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";
import { useCenterRegistrationStore } from "@/stores/centerRegistrationStore";
import { step1PersonalInfoSchema } from "@/lib/validations/centerRegistration";
import { checkCenterEmailAvailability } from "@/app/[locale]/register/center/actions";

interface Step1PersonalInfoProps {
  onNext: () => void;
}

export function Step1PersonalInfo({ onNext }: Step1PersonalInfoProps) {
  const t = useTranslations("centerRegistration.step1");
  const tAuth = useTranslations("auth");

  const { personalInfo, setPersonalInfo, setStepValid } = useCenterRegistrationStore();

  const [formData, setFormData] = useState({
    firstName: personalInfo.firstName || "",
    lastName: personalInfo.lastName || "",
    email: personalInfo.email || "",
    password: personalInfo.password || "",
    confirmPassword: personalInfo.confirmPassword || "",
    phone: personalInfo.phone || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);

  // Check email availability
  useEffect(() => {
    if (!formData.email || formData.email.length < 5 || !formData.email.includes("@")) {
      setEmailAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setEmailChecking(true);
      try {
        const available = await checkCenterEmailAvailability(formData.email);
        setEmailAvailable(available);
        if (!available) {
          setErrors((prev) => ({ ...prev, email: t("errors.emailExists") }));
        } else {
          setErrors((prev) => {
            const { email: _, ...rest } = prev;
            void _;
            return rest;
          });
        }
      } catch {
        // Ignore - will be caught on submit
      } finally {
        setEmailChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.email, t]);

  // Validate form on change
  const validateForm = useCallback(() => {
    const result = step1PersonalInfoSchema.safeParse(formData);
    return result.success;
  }, [formData]);

  // Update store when form changes
  useEffect(() => {
    setPersonalInfo(formData);
    setStepValid(1, validateForm() && emailAvailable !== false);
  }, [formData, setPersonalInfo, setStepValid, validateForm, emailAvailable]);

  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (errors[field]) {
      setErrors((prev) => {
        const { [field]: _, ...rest } = prev;
        void _;
        return rest;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    // Validate
    const result = step1PersonalInfoSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    // Check email one more time
    if (emailAvailable === false) {
      setErrors({ email: t("errors.emailExists") });
      setIsSubmitting(false);
      return;
    }

    // Save and proceed
    setPersonalInfo(formData);
    setStepValid(1, true);
    setIsSubmitting(false);
    onNext();
  };

  const passwordsMismatch =
    formData.password.length > 0 &&
    formData.confirmPassword.length > 0 &&
    formData.password !== formData.confirmPassword;

  const passwordsMatch =
    formData.password.length > 0 &&
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-white">{t("title")}</h2>
        <p className="text-sm text-white/60">{t("description")}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* First Name */}
        <div>
          <LiquidInput
            label={t("firstName")}
            value={formData.firstName}
            onChange={(e) => handleFieldChange("firstName", e.target.value)}
            error={errors.firstName}
            required
            autoComplete="given-name"
          />
          {errors.firstName && (
            <p className="mt-1 text-xs text-red-400">{errors.firstName}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <LiquidInput
            label={t("lastName")}
            value={formData.lastName}
            onChange={(e) => handleFieldChange("lastName", e.target.value)}
            error={errors.lastName}
            required
            autoComplete="family-name"
          />
          {errors.lastName && (
            <p className="mt-1 text-xs text-red-400">{errors.lastName}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <LiquidInput
          type="email"
          label={t("email")}
          value={formData.email}
          onChange={(e) => handleFieldChange("email", e.target.value)}
          error={errors.email || (emailAvailable === false ? t("errors.emailExists") : undefined)}
          required
          autoComplete="email"
        />
        {emailChecking && (
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            {t("checkingEmail")}
          </p>
        )}
        {emailAvailable === true && !emailChecking && formData.email && (
          <p className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
            <CheckCircle className="h-3 w-3" />
            {t("emailAvailable")}
          </p>
        )}
        {errors.email && (
          <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
            <AlertCircle className="h-3 w-3" />
            {errors.email}
          </p>
        )}
      </div>

      {/* Phone */}
      <div>
        <LiquidInput
          type="tel"
          label={t("phone")}
          value={formData.phone}
          onChange={(e) => handleFieldChange("phone", e.target.value)}
          error={errors.phone}
          required
          autoComplete="tel"
          placeholder="+33 6 12 34 56 78"
        />
        {errors.phone && (
          <p className="mt-1 text-xs text-red-400">{errors.phone}</p>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Password */}
        <div>
          <LiquidInput
            type="password"
            label={t("password")}
            value={formData.password}
            onChange={(e) => handleFieldChange("password", e.target.value)}
            error={errors.password}
            required
            autoComplete="new-password"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-400">{errors.password}</p>
          )}
          <PasswordStrengthIndicator password={formData.password} />
        </div>

        {/* Confirm Password */}
        <div>
          <LiquidInput
            type="password"
            label={t("confirmPassword")}
            value={formData.confirmPassword}
            onChange={(e) => handleFieldChange("confirmPassword", e.target.value)}
            error={passwordsMismatch ? tAuth("password_mismatch") : errors.confirmPassword}
            required
            autoComplete="new-password"
          />
          {passwordsMismatch && (
            <p className="mt-1 text-xs text-red-400">{tAuth("password_mismatch")}</p>
          )}
          {passwordsMatch && (
            <p className="mt-1 text-xs text-emerald-400">{tAuth("password_match")}</p>
          )}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || emailAvailable === false}
        className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-4 font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? (
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        ) : (
          t("next")
        )}
      </button>
    </form>
  );
}
