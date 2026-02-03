"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Building2,
  MapPin,
  Wrench,
  FileText,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOnboardStore } from "@/stores";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n/use-translations";

const STEP_DEFS = [
  { key: "basicInfo", icon: Building2 },
  { key: "location", icon: MapPin },
  { key: "services", icon: Wrench },
  { key: "legal", icon: FileText },
  { key: "review", icon: CheckCircle },
] as const;

const DIVE_TYPE_KEYS = [
  "reef",
  "wreck",
  "drift",
  "night",
  "cave",
  "deep",
  "technical",
  "beginner",
] as const;

const CERTIFICATION_KEYS = [
  "padi",
  "ssi",
  "naui",
  "cmas",
  "bsac",
  "raid",
  "sdi",
] as const;

const LANGUAGE_KEYS = ["en", "fr", "de", "es", "it", "pt", "nl", "ru", "zh", "ja", "ar"] as const;

export default function CenterOnboardPage() {
  const router = useRouter();
  const t = useTranslations("onboardCenter");
  const {
    centerBasic,
    centerLocation,
    centerServices,
    centerLegal,
    setCenterBasic,
    setCenterLocation,
    setCenterServices,
    setCenterLegal,
    resetCenterData,
  } = useOnboardStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Basic Info
  const [basic, setBasic] = useState({
    name: centerBasic.name || "",
    description: centerBasic.description || "",
    shortDescription: centerBasic.shortDescription || "",
    website: centerBasic.website || "",
    email: centerBasic.email || "",
    phone: centerBasic.phone || "",
  });

  // Location
  const [location, setLocation] = useState({
    address: centerLocation.address || "",
    city: centerLocation.city || "",
    region: centerLocation.region || "",
    country: centerLocation.country || "",
    postalCode: centerLocation.postalCode || "",
  });

  // Services
  const [services, setServices] = useState({
    diveTypes: centerServices.diveTypes || [],
    certifications: centerServices.certifications || [],
    languages: centerServices.languages || [],
    equipmentRental: centerServices.equipmentRental || false,
    accommodationPartners: centerServices.accommodationPartners || false,
    transportIncluded: centerServices.transportIncluded || false,
  });

  // Legal
  const [legal, setLegal] = useState({
    businessName: centerLegal.businessName || "",
    registrationNumber: centerLegal.registrationNumber || "",
    vatNumber: centerLegal.vatNumber || "",
    insuranceProvider: centerLegal.insuranceProvider || "",
    insurancePolicyNumber: centerLegal.insurancePolicyNumber || "",
    termsAccepted: centerLegal.termsAccepted || false,
  });

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 0:
        if (!basic.name.trim()) newErrors.name = t("errors.nameRequired");
        if (!basic.email.trim()) newErrors.email = t("errors.emailRequired");
        break;
      case 1:
        if (!location.city.trim()) newErrors.city = t("errors.cityRequired");
        if (!location.country.trim()) newErrors.country = t("errors.countryRequired");
        break;
      case 2:
        if (services.diveTypes.length === 0)
          newErrors.diveTypes = t("errors.diveTypesRequired");
        break;
      case 3:
        if (!legal.termsAccepted)
          newErrors.termsAccepted = t("errors.termsRequired");
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveCurrentStep = () => {
    switch (currentStep) {
      case 0:
        setCenterBasic(basic);
        break;
      case 1:
        setCenterLocation(location);
        break;
      case 2:
        setCenterServices(services);
        break;
      case 3:
        setCenterLegal(legal);
        break;
    }
  };

  const nextStep = () => {
    if (!validateStep()) return;
    saveCurrentStep();
    setCurrentStep((prev) => Math.min(prev + 1, STEP_DEFS.length - 1));
  };

  const prevStep = () => {
    saveCurrentStep();
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const toggleArrayItem = <T extends string>(
    arr: T[],
    item: T,
    setter: (fn: (prev: typeof services) => typeof services) => void,
    key: keyof typeof services
  ) => {
    setter((prev) => ({
      ...prev,
      [key]: arr.includes(item)
        ? (prev[key] as T[]).filter((i) => i !== item)
        : [...(prev[key] as T[]), item],
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/centers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...basic,
          ...location,
          ...services,
          ...legal,
        }),
      });

      if (response.ok) {
        resetCenterData();
        router.push("/dashboard?centerCreated=true");
      }
    } catch (error) {
      console.error("Failed to create center:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">{t("basicInfo.title")}</h3>
            <p className="text-white/60">
              {t("basicInfo.description")}
            </p>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">
                {t("basicInfo.name")}
              </label>
              <Input
                value={basic.name}
                onChange={(e) => setBasic((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={t("basicInfo.namePlaceholder")}
                className={cn(
                  "h-12 rounded-xl border-white/10 bg-white/5 text-white",
                  errors.name && "border-red-500"
                )}
              />
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">
                {t("basicInfo.shortDescription")}
              </label>
              <Input
                value={basic.shortDescription}
                onChange={(e) =>
                  setBasic((prev) => ({ ...prev, shortDescription: e.target.value }))
                }
                placeholder={t("basicInfo.shortDescriptionHint")}
                className="h-12 rounded-xl border-white/10 bg-white/5 text-white"
                maxLength={100}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">
                {t("basicInfo.fullDescription")}
              </label>
              <textarea
                value={basic.description}
                onChange={(e) =>
                  setBasic((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder={t("basicInfo.fullDescriptionPlaceholder")}
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-cyan-500/50 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">
                  {t("basicInfo.email")}
                </label>
                <Input
                  type="email"
                  value={basic.email}
                  onChange={(e) => setBasic((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder={t("basicInfo.emailPlaceholder")}
                  className={cn(
                    "h-12 rounded-xl border-white/10 bg-white/5 text-white",
                    errors.email && "border-red-500"
                  )}
                />
                {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">{t("basicInfo.phone")}</label>
                <Input
                  type="tel"
                  value={basic.phone}
                  onChange={(e) => setBasic((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder={t("basicInfo.phonePlaceholder")}
                  className="h-12 rounded-xl border-white/10 bg-white/5 text-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">{t("basicInfo.website")}</label>
              <Input
                type="url"
                value={basic.website}
                onChange={(e) => setBasic((prev) => ({ ...prev, website: e.target.value }))}
                placeholder={t("basicInfo.websitePlaceholder")}
                className="h-12 rounded-xl border-white/10 bg-white/5 text-white"
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">{t("location.title")}</h3>
            <p className="text-white/60">
              {t("location.description")}
            </p>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">{t("location.address")}</label>
              <Input
                value={location.address}
                onChange={(e) =>
                  setLocation((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder={t("location.addressPlaceholder")}
                className="h-12 rounded-xl border-white/10 bg-white/5 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">{t("location.city")}</label>
                <Input
                  value={location.city}
                  onChange={(e) => setLocation((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder={t("location.cityPlaceholder")}
                  className={cn(
                    "h-12 rounded-xl border-white/10 bg-white/5 text-white",
                    errors.city && "border-red-500"
                  )}
                />
                {errors.city && <p className="mt-1 text-xs text-red-400">{errors.city}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">
                  {t("location.region")}
                </label>
                <Input
                  value={location.region}
                  onChange={(e) =>
                    setLocation((prev) => ({ ...prev, region: e.target.value }))
                  }
                  placeholder={t("location.regionPlaceholder")}
                  className="h-12 rounded-xl border-white/10 bg-white/5 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">
                  {t("location.country")}
                </label>
                <Input
                  value={location.country}
                  onChange={(e) =>
                    setLocation((prev) => ({ ...prev, country: e.target.value }))
                  }
                  placeholder={t("location.countryPlaceholder")}
                  className={cn(
                    "h-12 rounded-xl border-white/10 bg-white/5 text-white",
                    errors.country && "border-red-500"
                  )}
                />
                {errors.country && (
                  <p className="mt-1 text-xs text-red-400">{errors.country}</p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">
                  {t("location.postalCode")}
                </label>
                <Input
                  value={location.postalCode}
                  onChange={(e) =>
                    setLocation((prev) => ({ ...prev, postalCode: e.target.value }))
                  }
                  placeholder={t("location.postalCodePlaceholder")}
                  className="h-12 rounded-xl border-white/10 bg-white/5 text-white"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold text-white">{t("services.title")}</h3>
              <p className="mt-2 text-white/60">
                {t("services.description")}
              </p>
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-white/70">
                {t("services.diveTypes")}
              </label>
              <div className="flex flex-wrap gap-2">
                {DIVE_TYPE_KEYS.map((typeKey) => (
                  <button
                    key={typeKey}
                    type="button"
                    onClick={() =>
                      toggleArrayItem(
                        services.diveTypes,
                        typeKey,
                        setServices as unknown as (
                          fn: (prev: typeof services) => typeof services
                        ) => void,
                        "diveTypes"
                      )
                    }
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-all",
                      services.diveTypes.includes(typeKey)
                        ? "border-cyan-500 bg-cyan-500/20 text-cyan-400"
                        : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                    )}
                  >
                    {t(`diveTypes.${typeKey}`)}
                  </button>
                ))}
              </div>
              {errors.diveTypes && (
                <p className="mt-2 text-xs text-red-400">{errors.diveTypes}</p>
              )}
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-white/70">
                {t("services.certifications")}
              </label>
              <div className="flex flex-wrap gap-2">
                {CERTIFICATION_KEYS.map((certKey) => (
                  <button
                    key={certKey}
                    type="button"
                    onClick={() =>
                      toggleArrayItem(
                        services.certifications,
                        certKey,
                        setServices as unknown as (
                          fn: (prev: typeof services) => typeof services
                        ) => void,
                        "certifications"
                      )
                    }
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-all",
                      services.certifications.includes(certKey)
                        ? "border-blue-500 bg-blue-500/20 text-blue-400"
                        : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                    )}
                  >
                    {t(`certifications.${certKey}`)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-medium text-white/70">
                {t("services.languagesSpoken")}
              </label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_KEYS.map((langKey) => (
                  <button
                    key={langKey}
                    type="button"
                    onClick={() =>
                      toggleArrayItem(
                        services.languages,
                        langKey,
                        setServices as unknown as (
                          fn: (prev: typeof services) => typeof services
                        ) => void,
                        "languages"
                      )
                    }
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-all",
                      services.languages.includes(langKey)
                        ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                        : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                    )}
                  >
                    {t(`languages.${langKey}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-white/70">
                {t("services.additionalServices")}
              </label>
              {[
                { key: "equipmentRental" as const, label: t("services.equipmentRental") },
                {
                  key: "accommodationPartners" as const,
                  label: t("services.accommodationPartners"),
                },
                { key: "transportIncluded" as const, label: t("services.transportIncluded") },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <span className="text-white/70">{label}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setServices((prev) => ({ ...prev, [key]: !prev[key] }))
                    }
                    className={cn(
                      "relative h-6 w-11 rounded-full transition-colors",
                      services[key] ? "bg-cyan-500" : "bg-white/20"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                        services[key] && "translate-x-5"
                      )}
                    />
                  </button>
                </label>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-white">{t("legal.title")}</h3>
            <p className="text-white/60">
              {t("legal.description")}
            </p>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">
                {t("legal.businessName")}
              </label>
              <Input
                value={legal.businessName}
                onChange={(e) =>
                  setLegal((prev) => ({ ...prev, businessName: e.target.value }))
                }
                placeholder={t("legal.businessNamePlaceholder")}
                className="h-12 rounded-xl border-white/10 bg-white/5 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">
                  {t("legal.registrationNumber")}
                </label>
                <Input
                  value={legal.registrationNumber}
                  onChange={(e) =>
                    setLegal((prev) => ({ ...prev, registrationNumber: e.target.value }))
                  }
                  placeholder={t("legal.registrationPlaceholder")}
                  className="h-12 rounded-xl border-white/10 bg-white/5 text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">
                  {t("legal.vatNumber")}
                </label>
                <Input
                  value={legal.vatNumber}
                  onChange={(e) =>
                    setLegal((prev) => ({ ...prev, vatNumber: e.target.value }))
                  }
                  placeholder={t("legal.vatPlaceholder")}
                  className="h-12 rounded-xl border-white/10 bg-white/5 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">
                  {t("legal.insuranceProvider")}
                </label>
                <Input
                  value={legal.insuranceProvider}
                  onChange={(e) =>
                    setLegal((prev) => ({ ...prev, insuranceProvider: e.target.value }))
                  }
                  placeholder={t("legal.insurancePlaceholder")}
                  className="h-12 rounded-xl border-white/10 bg-white/5 text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">
                  {t("legal.policyNumber")}
                </label>
                <Input
                  value={legal.insurancePolicyNumber}
                  onChange={(e) =>
                    setLegal((prev) => ({
                      ...prev,
                      insurancePolicyNumber: e.target.value,
                    }))
                  }
                  placeholder={t("legal.policyPlaceholder")}
                  className="h-12 rounded-xl border-white/10 bg-white/5 text-white"
                />
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={legal.termsAccepted}
                  onChange={(e) =>
                    setLegal((prev) => ({ ...prev, termsAccepted: e.target.checked }))
                  }
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-500"
                />
                <span className="text-sm text-white/70">
                  {t("legal.termsAccept")}{" "}
                  <a href="/terms" className="text-cyan-400 hover:underline">
                    {t("legal.termsLink")}
                  </a>{" "}
                  {t("legal.and")}{" "}
                  <a href="/privacy" className="text-cyan-400 hover:underline">
                    {t("legal.privacyLink")}
                  </a>
                  . *
                </span>
              </label>
              {errors.termsAccepted && (
                <p className="mt-2 text-xs text-red-400">{errors.termsAccepted}</p>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-400" />
            <h3 className="text-2xl font-bold text-white">{t("review.title")}</h3>
            <p className="text-white/60">
              {t("review.description")}
            </p>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
              <h4 className="mb-4 font-semibold text-white">{t("review.summaryTitle")}</h4>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <dt className="text-white/50">{t("review.centerName")}</dt>
                  <dd className="text-white">{basic.name}</dd>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <dt className="text-white/50">{t("review.location")}</dt>
                  <dd className="text-white">
                    {location.city}, {location.country}
                  </dd>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <dt className="text-white/50">{t("review.servicesLabel")}</dt>
                  <dd className="text-white">{t("review.services", { count: services.diveTypes.length })}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-white/50">{t("review.contact")}</dt>
                  <dd className="text-white">{basic.email}</dd>
                </div>
              </dl>
            </div>

            <p className="text-sm text-white/40">
              {t("review.afterApproval")}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-20">
      <div className="w-full max-w-2xl">
        {/* Progress Steps */}
        <div className="mb-12 flex items-center justify-center">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:gap-4">
            {STEP_DEFS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <div key={step.key} className="flex items-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all sm:h-12 sm:w-12",
                      isCompleted && "border-green-500 bg-green-500/20",
                      isActive && "border-cyan-500 bg-cyan-500/20",
                      !isActive && !isCompleted && "border-white/20 bg-white/5"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4 text-green-400 sm:h-5 sm:w-5" />
                    ) : (
                      <Icon
                        className={cn(
                          "h-4 w-4 sm:h-5 sm:w-5",
                          isActive ? "text-cyan-400" : "text-white/40"
                        )}
                      />
                    )}
                  </div>
                  {index < STEP_DEFS.length - 1 && (
                    <div
                      className={cn(
                        "mx-1 h-0.5 w-6 sm:mx-2 sm:w-10",
                        isCompleted ? "bg-green-500" : "bg-white/20"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <motion.div
          className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="h-12 rounded-xl border-white/10 bg-white/5 text-white disabled:opacity-30"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("navigation.back")}
            </Button>

            {currentStep < STEP_DEFS.length - 1 ? (
              <Button
                onClick={nextStep}
                className="h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500"
              >
                {t("navigation.continue")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Check className="mr-2 h-5 w-5" />
                )}
                {t("navigation.submit")}
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
