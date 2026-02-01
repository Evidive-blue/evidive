"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Building2, Award, Check } from "lucide-react";
import { LiquidInput } from "@/components/ui/liquid-input";
import { useCenterRegistrationStore, type CertificationType } from "@/stores/centerRegistrationStore";
import { step3LegalInfoSchema, certificationTypes } from "@/lib/validations/centerRegistration";
import { cn } from "@/lib/utils";

interface Step3LegalInfoProps {
  onNext: () => void;
  onBack: () => void;
}

const certificationLabels: Record<CertificationType, { name: string; color: string }> = {
  PADI: { name: "PADI", color: "from-blue-500 to-blue-600" },
  SSI: { name: "SSI", color: "from-cyan-500 to-cyan-600" },
  CMAS: { name: "CMAS", color: "from-green-500 to-green-600" },
  FFESSM: { name: "FFESSM", color: "from-red-500 to-red-600" },
  NAUI: { name: "NAUI", color: "from-purple-500 to-purple-600" },
  SDI: { name: "SDI", color: "from-orange-500 to-orange-600" },
  TDI: { name: "TDI", color: "from-amber-500 to-amber-600" },
  BSAC: { name: "BSAC", color: "from-indigo-500 to-indigo-600" },
};

export function Step3LegalInfo({ onNext, onBack }: Step3LegalInfoProps) {
  const t = useTranslations("centerRegistration.step3");

  const { legalInfo, setLegalInfo, setStepValid } = useCenterRegistrationStore();

  const [formData, setFormData] = useState({
    companyName: legalInfo.companyName || "",
    siretOrVat: legalInfo.siretOrVat || "",
    certifications: (legalInfo.certifications || []) as CertificationType[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate form on change
  const validateForm = useCallback(() => {
    const result = step3LegalInfoSchema.safeParse(formData);
    return result.success;
  }, [formData]);

  // Update store when form changes
  useEffect(() => {
    setLegalInfo(formData);
    setStepValid(3, validateForm());
  }, [formData, setLegalInfo, setStepValid, validateForm]);

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const { [field]: _, ...rest } = prev;
        void _;
        return rest;
      });
    }
  };

  const toggleCertification = (cert: CertificationType) => {
    setFormData((prev) => {
      const current = prev.certifications;
      if (current.includes(cert)) {
        return {
          ...prev,
          certifications: current.filter((c) => c !== cert),
        };
      }
      return {
        ...prev,
        certifications: [...current, cert],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    // Validate
    const result = step3LegalInfoSchema.safeParse(formData);
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
    setLegalInfo(formData);
    setStepValid(3, true);
    setIsSubmitting(false);
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-white">{t("title")}</h2>
        <p className="text-sm text-white/60">{t("description")}</p>
      </div>

      {/* Company Information */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-4 flex items-center gap-2 text-white/80">
          <Building2 className="h-4 w-4" />
          <span className="text-sm font-medium">{t("companySection")}</span>
          <span className="text-xs text-white/40">({t("optional")})</span>
        </div>
        <div className="space-y-4">
          <div>
            <LiquidInput
              label={t("companyName")}
              value={formData.companyName}
              onChange={(e) => handleFieldChange("companyName", e.target.value)}
              error={errors.companyName}
              placeholder={t("companyNamePlaceholder")}
            />
            {errors.companyName && (
              <p className="mt-1 text-xs text-red-400">{errors.companyName}</p>
            )}
          </div>
          <div>
            <LiquidInput
              label={t("siretOrVat")}
              value={formData.siretOrVat}
              onChange={(e) => handleFieldChange("siretOrVat", e.target.value)}
              error={errors.siretOrVat}
              placeholder={t("siretOrVatPlaceholder")}
            />
            {errors.siretOrVat && (
              <p className="mt-1 text-xs text-red-400">{errors.siretOrVat}</p>
            )}
            <p className="mt-1 text-xs text-white/40">{t("siretOrVatHint")}</p>
          </div>
        </div>
      </div>

      {/* Certifications */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="mb-4 flex items-center gap-2 text-white/80">
          <Award className="h-4 w-4" />
          <span className="text-sm font-medium">{t("certificationsSection")}</span>
        </div>
        <p className="mb-4 text-xs text-white/50">{t("certificationsHint")}</p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {certificationTypes.map((cert) => {
            const isSelected = formData.certifications.includes(cert);
            const label = certificationLabels[cert];

            return (
              <button
                key={cert}
                type="button"
                onClick={() => toggleCertification(cert)}
                className={cn(
                  "relative flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 font-medium transition-all",
                  isSelected
                    ? `border-transparent bg-gradient-to-r ${label.color} text-white shadow-lg`
                    : "border-white/20 bg-white/5 text-white/70 hover:border-white/40 hover:bg-white/10"
                )}
              >
                {isSelected && (
                  <Check className="absolute right-2 top-2 h-4 w-4" />
                )}
                <span>{label.name}</span>
              </button>
            );
          })}
        </div>

        {formData.certifications.length > 0 && (
          <p className="mt-4 text-sm text-cyan-400">
            {t("selectedCount", { count: formData.certifications.length })}
          </p>
        )}
      </div>

      {/* Note */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
        <p className="text-sm text-amber-200/90">
          {t("note")}
        </p>
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
