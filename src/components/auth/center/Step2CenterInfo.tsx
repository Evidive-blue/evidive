"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Globe, MapPin } from "lucide-react";
import { LiquidInput } from "@/components/ui/liquid-input";
import { useCenterRegistrationStore } from "@/stores/centerRegistrationStore";
import { step2CenterInfoSchema } from "@/lib/validations/centerRegistration";

interface Step2CenterInfoProps {
  onNext: () => void;
  onBack: () => void;
}

export function Step2CenterInfo({ onNext, onBack }: Step2CenterInfoProps) {
  const t = useTranslations("centerRegistration.step2");

  const { centerInfo, setCenterInfo, setStepValid } = useCenterRegistrationStore();

  const [formData, setFormData] = useState({
    centerName: {
      fr: centerInfo.centerName?.fr || "",
      en: centerInfo.centerName?.en || "",
    },
    street: centerInfo.street || "",
    city: centerInfo.city || "",
    postalCode: centerInfo.postalCode || "",
    country: centerInfo.country || "",
    latitude: centerInfo.latitude ?? null,
    longitude: centerInfo.longitude ?? null,
    website: centerInfo.website || "",
    shortDescription: {
      fr: centerInfo.shortDescription?.fr || "",
      en: centerInfo.shortDescription?.en || "",
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate form on change
  const validateForm = useCallback(() => {
    const dataToValidate = {
      ...formData,
      latitude: formData.latitude ?? 0,
      longitude: formData.longitude ?? 0,
    };
    const result = step2CenterInfoSchema.safeParse(dataToValidate);
    return result.success;
  }, [formData]);

  // Update store when form changes
  useEffect(() => {
    setCenterInfo(formData);
    setStepValid(2, validateForm());
  }, [formData, setCenterInfo, setStepValid, validateForm]);

  const handleFieldChange = (field: string, value: string | number | null) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, string>),
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
    // Clear error on change
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
    const dataToValidate = {
      ...formData,
      latitude: formData.latitude ?? 0,
      longitude: formData.longitude ?? 0,
    };
    const result = step2CenterInfoSchema.safeParse(dataToValidate);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    // Save and proceed
    setCenterInfo(formData);
    setStepValid(2, true);
    setIsSubmitting(false);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-white">{t("title")}</h2>
        <p className="text-sm text-white/60">{t("description")}</p>
      </div>

      {/* Center Name - Multilingual */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-4 flex items-center gap-2 text-white/80">
          <Globe className="h-4 w-4" />
          <span className="text-sm font-medium">{t("centerNameSection")}</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <LiquidInput
              label={t("centerNameFr")}
              value={formData.centerName.fr}
              onChange={(e) => handleFieldChange("centerName.fr", e.target.value)}
              error={errors["centerName.fr"]}
              required
            />
            {errors["centerName.fr"] && (
              <p className="mt-1 text-xs text-red-400">{errors["centerName.fr"]}</p>
            )}
          </div>
          <div>
            <LiquidInput
              label={t("centerNameEn")}
              value={formData.centerName.en}
              onChange={(e) => handleFieldChange("centerName.en", e.target.value)}
              error={errors["centerName.en"]}
              required
            />
            {errors["centerName.en"] && (
              <p className="mt-1 text-xs text-red-400">{errors["centerName.en"]}</p>
            )}
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-4 flex items-center gap-2 text-white/80">
          <MapPin className="h-4 w-4" />
          <span className="text-sm font-medium">{t("addressSection")}</span>
        </div>
        <div className="space-y-4">
          <div>
            <LiquidInput
              label={t("street")}
              value={formData.street}
              onChange={(e) => handleFieldChange("street", e.target.value)}
              error={errors.street}
              required
              placeholder="123 Rue de la Plongée"
            />
            {errors.street && (
              <p className="mt-1 text-xs text-red-400">{errors.street}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <LiquidInput
                label={t("city")}
                value={formData.city}
                onChange={(e) => handleFieldChange("city", e.target.value)}
                error={errors.city}
                required
              />
              {errors.city && (
                <p className="mt-1 text-xs text-red-400">{errors.city}</p>
              )}
            </div>
            <div>
              <LiquidInput
                label={t("postalCode")}
                value={formData.postalCode}
                onChange={(e) => handleFieldChange("postalCode", e.target.value)}
                error={errors.postalCode}
              />
            </div>
            <div>
              <LiquidInput
                label={t("country")}
                value={formData.country}
                onChange={(e) => handleFieldChange("country", e.target.value)}
                error={errors.country}
                required
              />
              {errors.country && (
                <p className="mt-1 text-xs text-red-400">{errors.country}</p>
              )}
            </div>
          </div>

          {/* Coordinates */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <LiquidInput
                type="number"
                label={t("latitude")}
                value={formData.latitude?.toString() || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  handleFieldChange("latitude", val ? parseFloat(val) : null);
                }}
                error={errors.latitude}
                required
                placeholder="43.2965"
              />
              {errors.latitude && (
                <p className="mt-1 text-xs text-red-400">{errors.latitude}</p>
              )}
            </div>
            <div>
              <LiquidInput
                type="number"
                label={t("longitude")}
                value={formData.longitude?.toString() || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  handleFieldChange("longitude", val ? parseFloat(val) : null);
                }}
                error={errors.longitude}
                required
                placeholder="5.3698"
              />
              {errors.longitude && (
                <p className="mt-1 text-xs text-red-400">{errors.longitude}</p>
              )}
            </div>
          </div>
          <p className="text-xs text-white/40">{t("coordsHint")}</p>
        </div>
      </div>

      {/* Website */}
      <div>
        <LiquidInput
          type="url"
          label={t("website")}
          value={formData.website}
          onChange={(e) => handleFieldChange("website", e.target.value)}
          error={errors.website}
          placeholder="https://www.moncentre.com"
        />
        {errors.website && (
          <p className="mt-1 text-xs text-red-400">{errors.website}</p>
        )}
      </div>

      {/* Short Description - Multilingual */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-4 flex items-center gap-2 text-white/80">
          <Globe className="h-4 w-4" />
          <span className="text-sm font-medium">{t("descriptionSection")}</span>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">
              {t("descriptionFr")} *
            </label>
            <textarea
              value={formData.shortDescription.fr}
              onChange={(e) => handleFieldChange("shortDescription.fr", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 transition-all focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              rows={3}
              placeholder={t("descriptionPlaceholder")}
              required
            />
            {errors["shortDescription.fr"] && (
              <p className="mt-1 text-xs text-red-400">{errors["shortDescription.fr"]}</p>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">
              {t("descriptionEn")} *
            </label>
            <textarea
              value={formData.shortDescription.en}
              onChange={(e) => handleFieldChange("shortDescription.en", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/30 transition-all focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
              rows={3}
              placeholder={t("descriptionPlaceholderEn")}
              required
            />
            {errors["shortDescription.en"] && (
              <p className="mt-1 text-xs text-red-400">{errors["shortDescription.en"]}</p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-xl border border-white/20 bg-white/5 px-6 py-4 font-semibold text-white transition-all hover:bg-white/10"
        >
          {t("back")}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-4 font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="mx-auto h-5 w-5 animate-spin" />
          ) : (
            t("next")
          )}
        </button>
      </div>
    </form>
  );
}
