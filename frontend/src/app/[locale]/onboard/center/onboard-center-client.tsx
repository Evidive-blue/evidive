"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Building2, MapPin, Activity, Loader2, Globe, Mail, Phone } from "lucide-react";
import {
  centersApi,
  referenceApi,
  type RefCountry,
  type RefDiveType,
  type RefCertification,
} from "@/lib/api";

function getLocalizedName(item: Record<string, unknown>, locale: string): string {
  const key = `name_${locale}`;
  const localized = item[key];
  if (typeof localized === "string" && localized) { return localized; }
  const fallback = item["name_en"];
  if (typeof fallback === "string" && fallback) { return fallback; }
  const name = item["name"];
  return typeof name === "string" ? name : "";
}

const SUPPORTED_LANGUAGES = ["fr", "en", "de", "es", "it", "pt", "nl"] as const;

export function OnboardCenterClient(): React.JSX.Element {
  const t = useTranslations("onboard");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reference data
  const [countries, setCountries] = useState<RefCountry[]>([]);
  const [diveTypes, setDiveTypes] = useState<RefDiveType[]>([]);
  const [certifications, setCertifications] = useState<RefCertification[]>([]);

  // Form state
  const [selectedDiveTypes, setSelectedDiveTypes] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["fr"]);
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);

  // Load reference data
  useEffect(() => {
    let cancelled = false;

    Promise.all([
      referenceApi.getCountries(),
      referenceApi.getDiveTypes(),
      referenceApi.getCertifications(),
    ]).then(([c, d, cert]) => {
      if (cancelled) { return; }
      setCountries(c);
      setDiveTypes(d);
      setCertifications(cert);
    }).catch(() => {
      // Reference data load failed — user can still fill most fields
    });

    return () => { cancelled = true; };
  }, []);

  function toggleInList(list: string[], value: string): string[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg(null);

    const form = e.currentTarget;
    const get = (name: string): string =>
      (form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)?.value ?? "";

    try {
      await centersApi.create({
        name: get("centerName"),
        description: get("description") || undefined,
        email: get("centerEmail"),
        phone: get("centerPhone") || undefined,
        website: get("website") || undefined,
        country: get("country"),
        city: get("city") || undefined,
        address: get("address") || undefined,
        postal_code: get("postalCode") || undefined,
        region: get("region") || undefined,
        dive_types: selectedDiveTypes.length > 0 ? selectedDiveTypes : undefined,
        languages: selectedLanguages.length > 0 ? selectedLanguages : undefined,
        certifications: selectedCerts.length > 0 ? selectedCerts : undefined,
      });

      router.push("/");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : t("error"));
      setStatus("error");
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-8"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
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

      {/* ── Section 1: Identity ── */}
      <fieldset className="space-y-4">
        <legend className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
          <Building2 className="h-4 w-4" aria-hidden="true" />
          {t("centerIdentity")}
        </legend>

        <div className="space-y-2">
          <label htmlFor="centerName" className="block text-sm font-medium text-slate-300">
            {t("centerName")}
          </label>
          <input
            id="centerName"
            name="centerName"
            type="text"
            required
            disabled={status === "loading"}
            className="input-ocean h-11 w-full px-4 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium text-slate-300">
            {t("centerDescription")}
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            disabled={status === "loading"}
            className="input-ocean w-full resize-none px-4 py-3 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="centerEmail" className="block text-sm font-medium text-slate-300">
              {t("centerEmail")}
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <input
                id="centerEmail"
                name="centerEmail"
                type="email"
                required
                disabled={status === "loading"}
                className="input-ocean h-11 w-full pl-10 pr-4 text-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="centerPhone" className="block text-sm font-medium text-slate-300">
              {t("centerPhone")}
            </label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <input
                id="centerPhone"
                name="centerPhone"
                type="tel"
                disabled={status === "loading"}
                className="input-ocean h-11 w-full pl-10 pr-4 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="website" className="block text-sm font-medium text-slate-300">
            {t("centerWebsite")}
          </label>
          <div className="relative">
            <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
            <input
              id="website"
              name="website"
              type="url"
              disabled={status === "loading"}
              className="input-ocean h-11 w-full pl-10 pr-4 text-sm"
            />
          </div>
        </div>
      </fieldset>

      {/* ── Section 2: Location ── */}
      <fieldset className="space-y-4">
        <legend className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
          <MapPin className="h-4 w-4" aria-hidden="true" />
          {t("centerLocation")}
        </legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="country" className="block text-sm font-medium text-slate-300">
              {t("country")}
            </label>
            <select
              id="country"
              name="country"
              required
              disabled={status === "loading"}
              className="input-ocean h-11 w-full appearance-none px-4 text-sm"
            >
              <option value="">{t("selectCountry")}</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {getLocalizedName(c as unknown as Record<string, unknown>, locale)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="city" className="block text-sm font-medium text-slate-300">
              {t("city")}
            </label>
            <input
              id="city"
              name="city"
              type="text"
              required
              disabled={status === "loading"}
              className="input-ocean h-11 w-full px-4 text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="address" className="block text-sm font-medium text-slate-300">
            {t("address")}
          </label>
          <input
            id="address"
            name="address"
            type="text"
            disabled={status === "loading"}
            className="input-ocean h-11 w-full px-4 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="postalCode" className="block text-sm font-medium text-slate-300">
              {t("postalCode")}
            </label>
            <input
              id="postalCode"
              name="postalCode"
              type="text"
              disabled={status === "loading"}
              className="input-ocean h-11 w-full px-4 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="region" className="block text-sm font-medium text-slate-300">
              {t("region")}
            </label>
            <input
              id="region"
              name="region"
              type="text"
              disabled={status === "loading"}
              className="input-ocean h-11 w-full px-4 text-sm"
            />
          </div>
        </div>
      </fieldset>

      {/* ── Section 3: Activity ── */}
      <fieldset className="space-y-4">
        <legend className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
          <Activity className="h-4 w-4" aria-hidden="true" />
          {t("centerActivity")}
        </legend>

        {/* Dive types */}
        {diveTypes.length > 0 && (
          <div className="space-y-2">
            <span className="block text-sm font-medium text-slate-300">{t("diveTypes")}</span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {diveTypes.map((dt) => {
                const dtCode = dt.code;
                const label = getLocalizedName(dt as unknown as Record<string, unknown>, locale);
                return (
                  <label key={dtCode} className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={selectedDiveTypes.includes(dtCode)}
                      onChange={() => setSelectedDiveTypes((prev) => toggleInList(prev, dtCode))}
                      disabled={status === "loading"}
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
          <span className="block text-sm font-medium text-slate-300">{t("languages")}</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <label key={lang} className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={selectedLanguages.includes(lang)}
                  onChange={() => setSelectedLanguages((prev) => toggleInList(prev, lang))}
                  disabled={status === "loading"}
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
            <span className="block text-sm font-medium text-slate-300">{t("certifications")}</span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {certifications.map((cert) => (
                <label key={cert.code} className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={selectedCerts.includes(cert.code)}
                    onChange={() => setSelectedCerts((prev) => toggleInList(prev, cert.code))}
                    disabled={status === "loading"}
                    className="h-4 w-4 shrink-0 rounded border-slate-600 bg-slate-800 text-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500"
                  />
                  {cert.name} {cert.organization ? `(${cert.organization})` : ""}
                </label>
              ))}
            </div>
          </div>
        )}
      </fieldset>

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "loading"}
        className="btn-ocean flex h-11 w-full items-center justify-center gap-2 px-6 text-sm"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {tCommon("loading")}
          </>
        ) : (
          t("createCenter")
        )}
      </button>
    </motion.form>
  );
}
