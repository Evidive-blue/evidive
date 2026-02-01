"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState, useId, useCallback, useEffect } from "react";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { LiquidInput } from "@/components/ui/liquid-input";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";
import { signIn } from "next-auth/react";
import { createDiverAccount, checkEmailAvailability } from "@/app/[locale]/register/actions";

export function RegisterForm() {
  const t = useTranslations("auth");
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  // Generate unique IDs for accessibility
  const formId = useId();
  const firstNameId = `${formId}-firstName`;
  const lastNameId = `${formId}-lastName`;
  const emailId = `${formId}-email`;
  const passwordId = `${formId}-password`;
  const confirmPasswordId = `${formId}-confirmPassword`;
  const termsId = `${formId}-terms`;

  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Field-level errors for inline display
  const [fieldErrors, setFieldErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // Validate individual fields
  const validateField = useCallback(
    (field: keyof typeof formData, value: string): string | undefined => {
      switch (field) {
        case "firstName":
          if (!value.trim()) return t("errors.firstName_required");
          if (value.length > 50) return t("errors.firstName_too_long");
          return undefined;
        case "lastName":
          if (!value.trim()) return t("errors.lastName_required");
          if (value.length > 50) return t("errors.lastName_too_long");
          return undefined;
        case "email":
          if (!value.trim()) return t("errors.email_required");
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
            return t("errors.email_invalid");
          return undefined;
        case "password":
          if (value.length < 8) return t("errors.password_min_length");
          if (!/[A-Z]/.test(value)) return t("errors.password_uppercase");
          if (!/[0-9]/.test(value)) return t("errors.password_number");
          return undefined;
        case "confirmPassword":
          if (value !== formData.password) return t("password_mismatch");
          return undefined;
        default:
          return undefined;
      }
    },
    [t, formData.password]
  );

  // Handle field change with validation
  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    // Clear email error when user changes email
    if (field === "email") {
      setEmailError(null);
    }
  };

  // Validate field on blur
  const handleFieldBlur = (field: keyof typeof formData) => {
    const error = validateField(field, formData[field]);
    setFieldErrors((prev) => ({ ...prev, [field]: error }));
  };

  // Check email availability with debounce
  useEffect(() => {
    if (!formData.email || fieldErrors.email) return;

    const timer = setTimeout(async () => {
      setIsCheckingEmail(true);
      try {
        const isAvailable = await checkEmailAvailability(formData.email);
        if (!isAvailable) {
          setEmailError(t("errors.email_exists"));
        } else {
          setEmailError(null);
        }
      } catch {
        // Silently fail - will be caught on submit
      } finally {
        setIsCheckingEmail(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.email, fieldErrors.email, t]);

  const passwordsMismatch =
    formData.password.length > 0 &&
    formData.confirmPassword.length > 0 &&
    formData.password !== formData.confirmPassword;

  const passwordsMatch =
    formData.password.length > 0 &&
    formData.confirmPassword.length > 0 &&
    formData.password === formData.confirmPassword;

  const missingRequiredFields =
    formData.firstName.trim().length === 0 ||
    formData.lastName.trim().length === 0 ||
    formData.email.trim().length === 0 ||
    formData.password.length === 0 ||
    formData.confirmPassword.length === 0;

  const hasValidationErrors =
    Object.values(fieldErrors).some(Boolean) || !!emailError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptTerms) {
      return;
    }

    // Validate all fields before submit
    const errors: typeof fieldErrors = {};
    (Object.keys(formData) as Array<keyof typeof formData>).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) errors[field] = error;
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    if (emailError) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await createDiverAccount(locale, formData);

      if (!result.success) {
        if (result.errorCode === "EMAIL_EXISTS") {
          setEmailError(t("errors.email_exists"));
        } else if (result.errorCode === "RATE_LIMIT") {
          setError(t("errors.rate_limit"));
        } else if (result.errorCode === "BLACKLISTED") {
          setError(t("errors.blacklisted"));
        } else {
          setError(result.error || t("generic_error"));
        }
        return;
      }

      setSuccess(true);

      // Auto-login after registration
      const signInResult = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.ok) {
        router.push(`/${locale}/dashboard`);
        router.refresh();
      } else {
        // Redirect to login if auto-login fails
        router.push(`/${locale}/login`);
      }
    } catch {
      setError(t("generic_error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden pb-12 pt-20">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute right-1/4 top-1/4 h-96 w-96 rounded-full bg-cyan-500/20 blur-[128px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/4 h-96 w-96 rounded-full bg-blue-900/40 blur-[128px]"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        className="relative z-10 mx-4 w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-white">
              {t("register_title")}
            </h1>
            <p className="text-sm text-slate-400">
              {t("has_account")}{" "}
              <Link
                href="/login"
                className="font-medium text-cyan-400 transition-colors hover:text-cyan-300"
              >
                {t("sign_in_link")}
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                role="alert"
                aria-live="polite"
              >
                <AlertCircle
                  className="h-4 w-4 flex-shrink-0"
                  aria-hidden="true"
                />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400"
                role="status"
                aria-live="polite"
              >
                <CheckCircle
                  className="h-4 w-4 flex-shrink-0"
                  aria-hidden="true"
                />
                <span>{t("register_success")}</span>
              </motion.div>
            )}

            {/* First Name */}
            <div>
              <LiquidInput
                id={firstNameId}
                label={t("first_name")}
                value={formData.firstName}
                onChange={(e) => handleFieldChange("firstName", e.target.value)}
                onBlur={() => handleFieldBlur("firstName")}
                error={fieldErrors.firstName}
                required
                autoComplete="given-name"
                aria-describedby={
                  fieldErrors.firstName ? `${firstNameId}-error` : undefined
                }
              />
              {fieldErrors.firstName && (
                <p
                  id={`${firstNameId}-error`}
                  className="mt-1 text-xs text-red-400"
                  role="alert"
                >
                  {fieldErrors.firstName}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <LiquidInput
                id={lastNameId}
                label={t("last_name")}
                value={formData.lastName}
                onChange={(e) => handleFieldChange("lastName", e.target.value)}
                onBlur={() => handleFieldBlur("lastName")}
                error={fieldErrors.lastName}
                required
                autoComplete="family-name"
                aria-describedby={
                  fieldErrors.lastName ? `${lastNameId}-error` : undefined
                }
              />
              {fieldErrors.lastName && (
                <p
                  id={`${lastNameId}-error`}
                  className="mt-1 text-xs text-red-400"
                  role="alert"
                >
                  {fieldErrors.lastName}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <LiquidInput
                id={emailId}
                type="email"
                label={t("email")}
                value={formData.email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                onBlur={() => handleFieldBlur("email")}
                error={fieldErrors.email || emailError || undefined}
                required
                autoComplete="email"
                aria-describedby={
                  fieldErrors.email || emailError
                    ? `${emailId}-error`
                    : isCheckingEmail
                      ? `${emailId}-checking`
                      : undefined
                }
              />
              {isCheckingEmail && (
                <p
                  id={`${emailId}-checking`}
                  className="mt-1 flex items-center gap-1 text-xs text-slate-400"
                >
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t("checking_email")}
                </p>
              )}
              {(fieldErrors.email || emailError) && (
                <p
                  id={`${emailId}-error`}
                  className="mt-1 text-xs text-red-400"
                  role="alert"
                >
                  {fieldErrors.email || emailError}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <LiquidInput
                id={passwordId}
                type="password"
                label={t("password")}
                value={formData.password}
                onChange={(e) => handleFieldChange("password", e.target.value)}
                onBlur={() => handleFieldBlur("password")}
                error={fieldErrors.password}
                required
                autoComplete="new-password"
                aria-describedby={`${passwordId}-strength ${fieldErrors.password ? `${passwordId}-error` : ""}`}
              />
              {fieldErrors.password && (
                <p
                  id={`${passwordId}-error`}
                  className="mt-1 text-xs text-red-400"
                  role="alert"
                >
                  {fieldErrors.password}
                </p>
              )}
              <div id={`${passwordId}-strength`}>
                <PasswordStrengthIndicator password={formData.password} />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <LiquidInput
                id={confirmPasswordId}
                type="password"
                label={t("confirm_password")}
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleFieldChange("confirmPassword", e.target.value)
                }
                onBlur={() => handleFieldBlur("confirmPassword")}
                error={
                  passwordsMismatch
                    ? t("password_mismatch")
                    : fieldErrors.confirmPassword
                }
                required
                autoComplete="new-password"
                aria-describedby={
                  passwordsMismatch || fieldErrors.confirmPassword
                    ? `${confirmPasswordId}-error`
                    : passwordsMatch
                      ? `${confirmPasswordId}-match`
                      : undefined
                }
              />
              {(passwordsMismatch || fieldErrors.confirmPassword) && (
                <p
                  id={`${confirmPasswordId}-error`}
                  className="mt-1 text-xs text-red-400"
                  role="alert"
                >
                  {passwordsMismatch
                    ? t("password_mismatch")
                    : fieldErrors.confirmPassword}
                </p>
              )}
              {passwordsMatch && (
                <p
                  id={`${confirmPasswordId}-match`}
                  className="mt-1 text-xs font-medium text-emerald-300"
                >
                  {t("password_match")}
                </p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id={termsId}
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500/50"
                required
                aria-describedby={`${termsId}-label`}
              />
              <label
                id={`${termsId}-label`}
                htmlFor={termsId}
                className="text-sm text-slate-400"
              >
                {t("accept_terms")}{" "}
                <Link href="/legal/terms" className="text-cyan-400 hover:underline">
                  {t("terms_link")}
                </Link>{" "}
                {t("and")}{" "}
                <Link href="/legal/privacy" className="text-cyan-400 hover:underline">
                  {t("privacy_link")}
                </Link>
              </label>
            </div>

            <MagneticButton
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={
                isLoading ||
                !acceptTerms ||
                passwordsMismatch ||
                missingRequiredFields ||
                hasValidationErrors
              }
            >
              {isLoading && (
                <Loader2
                  className="mr-2 h-5 w-5 animate-spin"
                  aria-hidden="true"
                />
              )}
              {t("submit_register")}
            </MagneticButton>
          </form>

          {/* Forgot Password Link */}
          <div className="mt-6 text-center">
            <Link
              href="/forgot-password"
              className="text-sm text-cyan-400/70 transition-colors hover:text-cyan-400"
            >
              {t("forgot_password")}
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
