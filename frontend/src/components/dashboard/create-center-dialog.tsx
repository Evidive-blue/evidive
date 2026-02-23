"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  MapPin,
  Activity,
  Loader2,
  Globe,
  Mail,
  Phone,
  ChevronRight,
  ChevronLeft,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  centersApi,
  referenceApi,
  type RefCountry,
  type RefDiveType,
  type RefCertification,
} from "@/lib/api";

function getLocalizedName(
  item: Record<string, unknown>,
  locale: string
): string {
  const key = `name_${locale}`;
  const localized = item[key];
  if (typeof localized === "string" && localized) {
    return localized;
  }
  const fallback = item["name_en"];
  if (typeof fallback === "string" && fallback) {
    return fallback;
  }
  const name = item["name"];
  return typeof name === "string" ? name : "";
}

const SUPPORTED_LANGUAGES = ["fr", "en", "de", "es", "it", "pt", "nl"] as const;

const STEPS = ["identity", "location", "activity"] as const;

/** Fields of the center creation form. */
type CenterFormData = {
  centerName: string;
  description: string;
  centerEmail: string;
  centerPhone: string;
  website: string;
  country: string;
  city: string;
  address: string;
  postalCode: string;
  region: string;
};

type CenterFormField = keyof CenterFormData;

type CreateCenterDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function CreateCenterDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateCenterDialogProps): React.JSX.Element {
  const t = useTranslations("onboard");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reference data
  const [countries, setCountries] = useState<RefCountry[]>([]);
  const [diveTypes, setDiveTypes] = useState<RefDiveType[]>([]);
  const [certifications, setCertifications] = useState<RefCertification[]>([]);

  // Form state
  const [formData, setFormData] = useState<CenterFormData>({
    centerName: "",
    description: "",
    centerEmail: "",
    centerPhone: "",
    website: "",
    country: "",
    city: "",
    address: "",
    postalCode: "",
    region: "",
  });
  const [selectedDiveTypes, setSelectedDiveTypes] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["fr"]);
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);

  // Load reference data when dialog opens
  useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;

    Promise.all([
      referenceApi.getCountries(),
      referenceApi.getDiveTypes(),
      referenceApi.getCertifications(),
    ])
      .then(([c, d, cert]) => {
        if (cancelled) {
          return;
        }
        setCountries(c);
        setDiveTypes(d);
        setCertifications(cert);
      })
      .catch(() => {
        // Reference data load failed — user can still fill most fields
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(0);
      setStatus("idle");
      setErrorMsg(null);
      setFormData({
        centerName: "",
        description: "",
        centerEmail: "",
        centerPhone: "",
        website: "",
        country: "",
        city: "",
        address: "",
        postalCode: "",
        region: "",
      } satisfies CenterFormData);
      setSelectedDiveTypes([]);
      setSelectedLanguages(["fr"]);
      setSelectedCerts([]);
    }
  }, [open]);

  const updateField = useCallback(
    (field: CenterFormField, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  function canProceed(): boolean {
    if (currentStep === 0) {
      return (
        formData.centerName.trim().length > 0 &&
        formData.centerEmail.trim().length > 0
      );
    }
    if (currentStep === 1) {
      return formData.country.trim().length > 0;
    }
    return true;
  }

  async function handleSubmit(): Promise<void> {
    setStatus("loading");
    setErrorMsg(null);

    try {
      await centersApi.create({
        name: formData.centerName,
        description: formData.description || undefined,
        email: formData.centerEmail,
        phone: formData.centerPhone || undefined,
        website: formData.website || undefined,
        country: formData.country,
        city: formData.city || undefined,
        address: formData.address || undefined,
        postal_code: formData.postalCode || undefined,
        region: formData.region || undefined,
        dive_types:
          selectedDiveTypes.length > 0 ? selectedDiveTypes : undefined,
        languages: selectedLanguages.length > 0 ? selectedLanguages : undefined,
        certifications: selectedCerts.length > 0 ? selectedCerts : undefined,
      });

      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t("error"));
      setStatus("error");
    }
  }

  const stepIcons = [Building2, MapPin, Activity] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="glass-ocean-solid max-h-[90vh] w-full overflow-hidden border-cyan-500/20 text-slate-100 sm:max-w-2xl"
        overlayClassName="bg-black/70 backdrop-blur-sm"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-white">
            {t("title")}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-400">
            {t("subtitle")}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          {STEPS.map((step, idx) => {
            const Icon = stepIcons[idx];
            const isActive = idx === currentStep;
            const isDone = idx < currentStep;
            return (
              <div key={step} className="flex items-center gap-2">
                {idx > 0 && (
                  <div
                    className={`h-px w-8 transition-colors duration-200 ${
                      isDone ? "bg-cyan-500" : "bg-slate-700"
                    }`}
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (idx <= currentStep) {
                      setCurrentStep(idx);
                    }
                  }}
                  disabled={idx > currentStep}
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 ${
                    isActive
                      ? "bg-cyan-500/20 text-cyan-400 ring-2 ring-cyan-500/40"
                      : isDone
                        ? "bg-cyan-500/10 text-cyan-400"
                        : "bg-slate-800 text-slate-500"
                  }`}
                  aria-label={t(
                    step === "identity"
                      ? "centerIdentity"
                      : step === "location"
                        ? "centerLocation"
                        : "centerActivity"
                  )}
                >
                  {isDone ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    Icon !== undefined && <Icon className="h-4 w-4" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Error message */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400"
            role="alert"
          >
            {errorMsg}
          </motion.div>
        )}

        {/* Step content */}
        <div className="max-h-[55vh] overflow-y-auto pr-1">
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <StepIdentity
                key="identity"
                formData={formData}
                updateField={updateField}
                status={status}
                t={t}
              />
            )}
            {currentStep === 1 && (
              <StepLocation
                key="location"
                formData={formData}
                updateField={updateField}
                countries={countries}
                locale={locale}
                status={status}
                t={t}
              />
            )}
            {currentStep === 2 && (
              <StepActivity
                key="activity"
                diveTypes={diveTypes}
                certifications={certifications}
                selectedDiveTypes={selectedDiveTypes}
                setSelectedDiveTypes={setSelectedDiveTypes}
                selectedLanguages={selectedLanguages}
                setSelectedLanguages={setSelectedLanguages}
                selectedCerts={selectedCerts}
                setSelectedCerts={setSelectedCerts}
                locale={locale}
                status={status}
                t={t}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between border-t border-slate-700/50 pt-4">
          <button
            type="button"
            onClick={() => setCurrentStep((s) => s - 1)}
            disabled={currentStep === 0 || status === "loading"}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
            {tCommon("back")}
          </button>

          {currentStep < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => s + 1)}
              disabled={!canProceed() || status === "loading"}
              className="btn-ocean flex items-center gap-1.5 px-5 py-2 text-sm disabled:pointer-events-none disabled:opacity-40"
            >
              {tCommon("next")}
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={status === "loading"}
              className="btn-ocean flex items-center gap-1.5 px-5 py-2 text-sm disabled:pointer-events-none disabled:opacity-40"
            >
              {status === "loading" ? (
                <>
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                  {tCommon("loading")}
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  {t("createCenter")}
                </>
              )}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Step sub-components ─── */

const stepMotion = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
  transition: { duration: 0.2, ease: "easeOut" as const },
};

type StepIdentityProps = {
  formData: CenterFormData;
  updateField: (field: CenterFormField, value: string) => void;
  status: string;
  t: ReturnType<typeof useTranslations>;
};

function StepIdentity({
  formData,
  updateField,
  status,
  t,
}: StepIdentityProps): React.JSX.Element {
  const disabled = status === "loading";
  return (
    <motion.div {...stepMotion} className="space-y-4 py-2">
      <div className="space-y-2">
        <label
          htmlFor="dlg-centerName"
          className="block text-sm font-medium text-slate-300"
        >
          {t("centerName")}
        </label>
        <input
          id="dlg-centerName"
          type="text"
          required
          value={formData["centerName"]}
          onChange={(e) => updateField("centerName", e.target.value)}
          disabled={disabled}
          className="input-ocean h-11 w-full px-4 text-sm"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="dlg-description"
          className="block text-sm font-medium text-slate-300"
        >
          {t("centerDescription")}
        </label>
        <textarea
          id="dlg-description"
          rows={3}
          value={formData["description"]}
          onChange={(e) => updateField("description", e.target.value)}
          disabled={disabled}
          className="input-ocean w-full resize-none px-4 py-3 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="dlg-centerEmail"
            className="block text-sm font-medium text-slate-300"
          >
            {t("centerEmail")}
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              id="dlg-centerEmail"
              type="email"
              required
              value={formData["centerEmail"]}
              onChange={(e) => updateField("centerEmail", e.target.value)}
              disabled={disabled}
              className="input-ocean h-11 w-full pl-10 pr-4 text-sm"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label
            htmlFor="dlg-centerPhone"
            className="block text-sm font-medium text-slate-300"
          >
            {t("centerPhone")}
          </label>
          <div className="relative">
            <Phone
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              id="dlg-centerPhone"
              type="tel"
              value={formData["centerPhone"]}
              onChange={(e) => updateField("centerPhone", e.target.value)}
              disabled={disabled}
              className="input-ocean h-11 w-full pl-10 pr-4 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="dlg-website"
          className="block text-sm font-medium text-slate-300"
        >
          {t("centerWebsite")}
        </label>
        <div className="relative">
          <Globe
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <input
            id="dlg-website"
            type="url"
            value={formData["website"]}
            onChange={(e) => updateField("website", e.target.value)}
            disabled={disabled}
            className="input-ocean h-11 w-full pl-10 pr-4 text-sm"
          />
        </div>
      </div>
    </motion.div>
  );
}

type StepLocationProps = {
  formData: CenterFormData;
  updateField: (field: CenterFormField, value: string) => void;
  countries: RefCountry[];
  locale: string;
  status: string;
  t: ReturnType<typeof useTranslations>;
};

function StepLocation({
  formData,
  updateField,
  countries,
  locale,
  status,
  t,
}: StepLocationProps): React.JSX.Element {
  const disabled = status === "loading";
  return (
    <motion.div {...stepMotion} className="space-y-4 py-2">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="dlg-country"
            className="block text-sm font-medium text-slate-300"
          >
            {t("country")}
          </label>
          <select
            id="dlg-country"
            required
            value={formData["country"]}
            onChange={(e) => updateField("country", e.target.value)}
            disabled={disabled}
            className="input-ocean h-11 w-full appearance-none px-4 text-sm"
          >
            <option value="">{t("selectCountry")}</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {getLocalizedName(
                  c as unknown as Record<string, unknown>,
                  locale
                )}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label
            htmlFor="dlg-city"
            className="block text-sm font-medium text-slate-300"
          >
            {t("city")}
          </label>
          <input
            id="dlg-city"
            type="text"
            value={formData["city"]}
            onChange={(e) => updateField("city", e.target.value)}
            disabled={disabled}
            className="input-ocean h-11 w-full px-4 text-sm"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="dlg-address"
          className="block text-sm font-medium text-slate-300"
        >
          {t("address")}
        </label>
        <input
          id="dlg-address"
          type="text"
          value={formData["address"]}
          onChange={(e) => updateField("address", e.target.value)}
          disabled={disabled}
          className="input-ocean h-11 w-full px-4 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="dlg-postalCode"
            className="block text-sm font-medium text-slate-300"
          >
            {t("postalCode")}
          </label>
          <input
            id="dlg-postalCode"
            type="text"
            value={formData["postalCode"]}
            onChange={(e) => updateField("postalCode", e.target.value)}
            disabled={disabled}
            className="input-ocean h-11 w-full px-4 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label
            htmlFor="dlg-region"
            className="block text-sm font-medium text-slate-300"
          >
            {t("region")}
          </label>
          <input
            id="dlg-region"
            type="text"
            value={formData["region"]}
            onChange={(e) => updateField("region", e.target.value)}
            disabled={disabled}
            className="input-ocean h-11 w-full px-4 text-sm"
          />
        </div>
      </div>
    </motion.div>
  );
}

type StepActivityProps = {
  diveTypes: RefDiveType[];
  certifications: RefCertification[];
  selectedDiveTypes: string[];
  setSelectedDiveTypes: React.Dispatch<React.SetStateAction<string[]>>;
  selectedLanguages: string[];
  setSelectedLanguages: React.Dispatch<React.SetStateAction<string[]>>;
  selectedCerts: string[];
  setSelectedCerts: React.Dispatch<React.SetStateAction<string[]>>;
  locale: string;
  status: string;
  t: ReturnType<typeof useTranslations>;
};

function StepActivity({
  diveTypes,
  certifications,
  selectedDiveTypes,
  setSelectedDiveTypes,
  selectedLanguages,
  setSelectedLanguages,
  selectedCerts,
  setSelectedCerts,
  locale,
  status,
  t,
}: StepActivityProps): React.JSX.Element {
  const disabled = status === "loading";

  function toggleInList(list: string[], value: string): string[] {
    return list.includes(value)
      ? list.filter((v) => v !== value)
      : [...list, value];
  }

  return (
    <motion.div {...stepMotion} className="space-y-4 py-2">
      {/* Dive types */}
      {diveTypes.length > 0 && (
        <div className="space-y-2">
          <span className="block text-sm font-medium text-slate-300">
            {t("diveTypes")}
          </span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {diveTypes.map((dt) => {
              const label = getLocalizedName(
                dt as unknown as Record<string, unknown>,
                locale
              );
              return (
                <label
                  key={dt.code}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-300 transition-colors hover:bg-slate-800/50"
                >
                  <input
                    type="checkbox"
                    checked={selectedDiveTypes.includes(dt.code)}
                    onChange={() =>
                      setSelectedDiveTypes((prev) =>
                        toggleInList(prev, dt.code)
                      )
                    }
                    disabled={disabled}
                    className="h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-800 text-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500"
                  />
                  {label}
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Languages */}
      <div className="space-y-2">
        <span className="block text-sm font-medium text-slate-300">
          {t("languages")}
        </span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <label
              key={lang}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-300 transition-colors hover:bg-slate-800/50"
            >
              <input
                type="checkbox"
                checked={selectedLanguages.includes(lang)}
                onChange={() =>
                  setSelectedLanguages((prev) => toggleInList(prev, lang))
                }
                disabled={disabled}
                className="h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-800 text-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500"
              />
              {t(`locale_${lang}`)}
            </label>
          ))}
        </div>
      </div>

      {/* Certifications */}
      {certifications.length > 0 && (
        <div className="space-y-2">
          <span className="block text-sm font-medium text-slate-300">
            {t("certifications")}
          </span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {certifications.map((cert) => (
              <label
                key={cert.code}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-300 transition-colors hover:bg-slate-800/50"
              >
                <input
                  type="checkbox"
                  checked={selectedCerts.includes(cert.code)}
                  onChange={() =>
                    setSelectedCerts((prev) => toggleInList(prev, cert.code))
                  }
                  disabled={disabled}
                  className="h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-800 text-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500"
                />
                {cert.name}
                {cert.organization ? ` (${cert.organization})` : ""}
              </label>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
