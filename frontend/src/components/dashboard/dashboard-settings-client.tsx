"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { centerApi, type CenterResponse } from "@/lib/api";
import { PageHeader } from "@/components/admin/page-header";
import { PageSkeleton } from "@/components/admin/loading-skeleton";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

/* ─── Form shape (inferred from Zod schema at component level) ─── */

type SettingsForm = {
  display_name: string;
  description: string;
  email: string;
  address: string;
  city: string;
  region: string;
  postal_code: string;
  country: string;
  latitude: string;
  longitude: string;
  phone: string;
  website: string;
  facebook_url: string;
  instagram_url: string;
  dive_types: string;
  languages: string;
  certifications: string;
  payment_methods: string;
  price_from: string;
  currency: string;
  eco_commitment: boolean;
};

/* ─── Helpers ─── */

function arrayToCSV(arr: string[] | null | undefined): string {
  if (!arr || arr.length === 0) return "";
  return arr.join(", ");
}

function csvToArray(csv: string): string[] {
  if (!csv.trim()) return [];
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/* ─── Component ─── */

export function DashboardSettingsClient(): React.ReactNode {
  const t = useTranslations("dashboard");

  const profileSchema = z.object({
    display_name: z.string().min(1, t("required")),
    description: z.string().default(""),
    email: z.string().email(t("invalidEmail")),
    address: z.string().default(""),
    city: z.string().default(""),
    region: z.string().default(""),
    postal_code: z.string().default(""),
    country: z.string().min(1, t("required")),
    latitude: z
      .string()
      .default("")
      .refine(
        (v) =>
          v === "" ||
          (!isNaN(Number(v)) && Number(v) >= -90 && Number(v) <= 90),
        { message: "-90 to 90" }
      ),
    longitude: z
      .string()
      .default("")
      .refine(
        (v) =>
          v === "" ||
          (!isNaN(Number(v)) && Number(v) >= -180 && Number(v) <= 180),
        { message: "-180 to 180" }
      ),
    phone: z.string().default(""),
    website: z.string().url().or(z.literal("")).default(""),
    facebook_url: z.string().url().or(z.literal("")).default(""),
    instagram_url: z.string().url().or(z.literal("")).default(""),
    dive_types: z.string().default(""),
    languages: z.string().default(""),
    certifications: z.string().default(""),
    payment_methods: z.string().default(""),
    price_from: z
      .string()
      .default("")
      .refine((v) => v === "" || (!isNaN(Number(v)) && Number(v) >= 0), {
        message: ">= 0",
      }),
    currency: z.string().default("EUR"),
    eco_commitment: z.boolean().default(false),
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<CenterResponse | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<SettingsForm>({
    resolver: zodResolver(profileSchema) as Resolver<SettingsForm>,
  });

  const mapResponseToForm = useCallback(
    (data: CenterResponse): SettingsForm => ({
      display_name: data.display_name ?? data.name ?? "",
      description: data.description ?? "",
      email: data.email ?? "",
      address: data.address ?? "",
      city: data.city ?? "",
      region: data.region ?? "",
      postal_code: data.postal_code ?? data.zip ?? "",
      country: data.country ?? "",
      latitude: data.latitude != null ? String(data.latitude) : "",
      longitude: data.longitude != null ? String(data.longitude) : "",
      phone: data.phone ?? "",
      website: data.website ?? "",
      facebook_url: data.facebook_url ?? "",
      instagram_url: data.instagram_url ?? "",
      dive_types: arrayToCSV(data.dive_types),
      languages: arrayToCSV(data.languages),
      certifications: arrayToCSV(data.certifications),
      payment_methods: arrayToCSV(data.payment_methods),
      price_from: data.price_from != null ? String(data.price_from) : "",
      currency: data.currency ?? "EUR",
      eco_commitment: data.eco_commitment ?? false,
    }),
    []
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await centerApi.getProfile();
      setProfile(data);
      reset(mapResponseToForm(data));
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [reset, t, mapResponseToForm]);

  useEffect(() => {
    load();
  }, [load]);

  const onSubmit = async (data: SettingsForm) => {
    setSaving(true);
    try {
      const payload: Partial<CenterResponse> = {
        name: data.display_name,
        description: data.description || undefined,
        email: data.email,
        address: data.address || undefined,
        city: data.city || undefined,
        region: data.region || undefined,
        postal_code: data.postal_code || undefined,
        country: data.country,
        latitude: data.latitude ? Number(data.latitude) : null,
        longitude: data.longitude ? Number(data.longitude) : null,
        phone: data.phone || undefined,
        website: data.website || undefined,
        facebook_url: data.facebook_url || undefined,
        instagram_url: data.instagram_url || undefined,
        dive_types: csvToArray(data.dive_types),
        languages: csvToArray(data.languages),
        certifications: csvToArray(data.certifications),
        payment_methods: csvToArray(data.payment_methods),
        price_from: data.price_from ? Number(data.price_from) : null,
        currency: data.currency || "EUR",
        eco_commitment: data.eco_commitment,
      };
      await centerApi.updateProfile(payload);
      toast.success(t("profileUpdated"));
      await load();
    } catch {
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  const inputCls =
    "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500";

  return (
    <div className="space-y-6">
      <PageHeader titleKey="centerProfile" namespace="dashboard" />

      {profile && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <StatusBadge status={profile.status} />
          {profile.verified && (
            <StatusBadge status="active" label={t("verified")} />
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-8">
        {/* ─── General ─── */}
        <Section title={t("sectionGeneral")}>
          <Field label={t("displayName")} error={errors.display_name?.message}>
            <input {...register("display_name")} className={inputCls} />
          </Field>

          <Field
            label={t("centerEmail")}
            help={t("centerEmailHelp")}
            error={errors.email?.message}
          >
            <input {...register("email")} type="email" className={inputCls} />
          </Field>

          <Field label={t("description")}>
            <textarea
              {...register("description")}
              rows={4}
              className={inputCls}
            />
          </Field>
        </Section>

        {/* ─── Location ─── */}
        <Section title={t("sectionLocation")}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t("address")}>
              <input {...register("address")} className={inputCls} />
            </Field>
            <Field label={t("city")}>
              <input {...register("city")} className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label={t("region")}>
              <input {...register("region")} className={inputCls} />
            </Field>
            <Field label={t("zip")}>
              <input {...register("postal_code")} className={inputCls} />
            </Field>
            <Field label={t("country")} error={errors.country?.message}>
              <input {...register("country")} className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label={t("latitude")}
              help={t("coordinatesHelp")}
              error={errors.latitude?.message}
            >
              <input
                {...register("latitude")}
                type="text"
                inputMode="decimal"
                placeholder="-90 to 90"
                className={inputCls}
              />
            </Field>
            <Field label={t("longitude")} error={errors.longitude?.message}>
              <input
                {...register("longitude")}
                type="text"
                inputMode="decimal"
                placeholder="-180 to 180"
                className={inputCls}
              />
            </Field>
          </div>
        </Section>

        {/* ─── Contact & Social ─── */}
        <Section title={t("sectionContactSocial")}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t("phone")}>
              <input {...register("phone")} type="tel" className={inputCls} />
            </Field>
            <Field label={t("website")} error={errors.website?.message}>
              <input
                {...register("website")}
                placeholder="https://"
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label={t("facebookUrl")}
              error={errors.facebook_url?.message}
            >
              <input
                {...register("facebook_url")}
                placeholder="https://facebook.com/..."
                className={inputCls}
              />
            </Field>
            <Field
              label={t("instagramUrl")}
              error={errors.instagram_url?.message}
            >
              <input
                {...register("instagram_url")}
                placeholder="https://instagram.com/..."
                className={inputCls}
              />
            </Field>
          </div>
        </Section>

        {/* ─── Diving ─── */}
        <Section title={t("sectionDiving")}>
          <Field label={t("diveTypes")} help={t("diveTypesHelp")}>
            <input {...register("dive_types")} className={inputCls} />
          </Field>

          <Field label={t("languages")} help={t("languagesHelp")}>
            <input {...register("languages")} className={inputCls} />
          </Field>

          <Field label={t("certifications")} help={t("certificationsHelp")}>
            <input {...register("certifications")} className={inputCls} />
          </Field>
        </Section>

        {/* ─── Business ─── */}
        <Section title={t("sectionBusiness")}>
          <Field label={t("paymentMethods")} help={t("paymentMethodsHelp")}>
            <input {...register("payment_methods")} className={inputCls} />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label={t("priceFrom")}
              help={t("priceFromHelp")}
              error={errors.price_from?.message}
            >
              <input
                {...register("price_from")}
                type="text"
                inputMode="decimal"
                className={inputCls}
              />
            </Field>
            <Field label={t("currency")}>
              <input
                {...register("currency")}
                placeholder="EUR"
                className={inputCls}
              />
            </Field>
          </div>

          <label className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 transition-colors hover:border-slate-600">
            <input
              type="checkbox"
              {...register("eco_commitment")}
              className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500"
            />
            <div>
              <span className="text-sm font-medium text-slate-200">
                {t("ecoCommitment")}
              </span>
              <p className="text-xs text-slate-500">{t("ecoCommitmentHelp")}</p>
            </div>
          </label>
        </Section>

        {/* ─── Submit ─── */}
        <div className="flex items-center gap-3 border-t border-slate-800 pt-4">
          <Button
            type="submit"
            disabled={saving || !isDirty}
            className="bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : null}
            {t("updateProfile")}
          </Button>
        </div>
      </form>
    </div>
  );
}

/* ─── Sub-components ─── */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <fieldset className="space-y-4">
      <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </legend>
      <div className="space-y-4 rounded-lg border border-slate-800 bg-slate-900/30 p-4">
        {children}
      </div>
    </fieldset>
  );
}

function Field({
  label,
  help,
  error,
  children,
}: {
  label: string;
  help?: string;
  error?: string;
  children: React.ReactNode;
}): React.ReactNode {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}
      </label>
      {children}
      {help && !error && <p className="mt-1 text-xs text-slate-500">{help}</p>}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
