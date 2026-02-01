"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Loader2 } from "lucide-react";
import { LiquidInput } from "@/components/ui/liquid-input";
import { useOnboardStore } from "@/stores/onboard-store";
import { centerInfoSchema } from "@/lib/validations/center";
import type { CenterInfoData } from "@/lib/validations/center";

interface CenterInfoStepProps {
  isDrawer?: boolean;
  onNext?: () => void;
  onBack?: () => void;
}

export function InfoStep({
  isDrawer = false,
  onNext,
  onBack,
}: CenterInfoStepProps) {
  const router = useRouter();

  const { centerAccount, centerInfo, setCenterInfo, _hasHydrated } = useOnboardStore();

  // Handle redirect client-side only after hydration
  useEffect(() => {
    if (_hasHydrated && !centerAccount?.email) {
      if (isDrawer && onBack) {
        onBack();
      } else {
        router.push("/onboard/center/account");
      }
    }
  }, [_hasHydrated, centerAccount?.email, isDrawer, onBack, router]);

  // Show loading while hydrating or if no data
  if (!_hasHydrated || !centerAccount?.email) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <InfoStepHydrated
      initialCenterInfo={centerInfo}
      onSubmit={(data) => {
        setCenterInfo(data);
        if (onNext) {
          onNext();
        } else {
          router.push("/onboard/center/location");
        }
      }}
    />
  );
}

function InfoStepHydrated({
  initialCenterInfo,
  onSubmit,
}: {
  initialCenterInfo: Partial<CenterInfoData> | null;
  onSubmit: (data: {
    centerName: string;
    description: string;
    website?: string;
    facebook?: string;
    instagram?: string;
  }) => void;
}) {
  const t = useTranslations("onboard.center.info");
  const tErrors = useTranslations("onboard.center.info.errors");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    centerName: (initialCenterInfo?.centerName as string | undefined) ?? "",
    description: (initialCenterInfo?.description as string | undefined) ?? "",
    website: (initialCenterInfo?.website as string | undefined) ?? "",
    facebook: (initialCenterInfo?.facebook as string | undefined) ?? "",
    instagram: (initialCenterInfo?.instagram as string | undefined) ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const parsed = centerInfoSchema.safeParse({
      centerName: formData.centerName,
      description: formData.description,
      website: formData.website,
      facebook: formData.facebook,
      instagram: formData.instagram,
      phone: "",
    });

    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "centerName") next.centerName = tErrors("centerName");
        if (field === "description") next.description = tErrors("description");
        if (field === "website") next.website = tErrors("website");
      }
      setErrors(next);
      setIsLoading(false);
      return;
    }

    onSubmit({
      centerName: formData.centerName,
      description: formData.description,
      website: formData.website.trim().length > 0 ? formData.website : undefined,
      facebook: formData.facebook.trim().length > 0 ? formData.facebook : undefined,
      instagram: formData.instagram.trim().length > 0 ? formData.instagram : undefined,
    });

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-white/60">{t("description")}</p>

      <div>
        <LiquidInput
          label={t("centerName")}
          value={formData.centerName}
          onChange={(e) => setFormData({ ...formData, centerName: e.target.value })}
          required
        />
        {errors.centerName && <p className="mt-1 text-sm text-red-400">{errors.centerName}</p>}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-white/70">
          {t("aboutCenter")}
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          placeholder={t("aboutPlaceholder")}
          required
        />
        {errors.description && <p className="mt-1 text-sm text-red-400">{errors.description}</p>}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <LiquidInput
          type="url"
          label={t("website")}
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
        />
        <LiquidInput
          label={t("facebook")}
          value={formData.facebook}
          onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
        />
      </div>

      <LiquidInput
        label={t("instagram")}
        value={formData.instagram}
        onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
      />

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-4 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        ) : (
          t("submit")
        )}
      </button>
    </form>
  );
}
