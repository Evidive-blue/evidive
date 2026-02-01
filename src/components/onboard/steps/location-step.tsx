"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { MapPin, Loader2 } from "lucide-react";
import { LiquidInput } from "@/components/ui/liquid-input";
import { useOnboardStore } from "@/stores/onboard-store";
import { centerLocationSchema } from "@/lib/validations/center";
import type { CenterLocationData } from "@/lib/validations/center";

interface CenterLocationStepProps {
  isDrawer?: boolean;
  onNext?: () => void;
  onBack?: () => void;
}

export function LocationStep({
  isDrawer = false,
  onNext,
  onBack,
}: CenterLocationStepProps) {
  const router = useRouter();

  const { centerAccount, centerInfo, centerLocation, setCenterLocation, _hasHydrated } = useOnboardStore();

  // Handle redirect client-side only after hydration
  useEffect(() => {
    if (_hasHydrated && (!centerAccount?.email || !centerInfo?.centerName)) {
      if (isDrawer && onBack) {
        onBack();
      } else {
        router.push("/onboard/center/account");
      }
    }
  }, [_hasHydrated, centerAccount?.email, centerInfo?.centerName, isDrawer, onBack, router]);

  // Show loading while hydrating or if no data
  if (!_hasHydrated || !centerAccount?.email || !centerInfo?.centerName) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <LocationStepHydrated
      initialCenterLocation={centerLocation}
      onSubmit={(data) => {
        setCenterLocation(data);
        if (onNext) {
          onNext();
        } else {
          router.push("/onboard/center/documents");
        }
      }}
    />
  );
}

function LocationStepHydrated({
  initialCenterLocation,
  onSubmit,
}: {
  initialCenterLocation: Partial<CenterLocationData> | null;
  onSubmit: (data: {
    address: string;
    city: string;
    postalCode?: string;
    country: string;
    latitude: number;
    longitude: number;
  }) => void;
}) {
  const t = useTranslations("onboard.center.location");
  const tErrors = useTranslations("onboard.center.location.errors");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    address: (initialCenterLocation?.address as string | undefined) ?? "",
    city: (initialCenterLocation?.city as string | undefined) ?? "",
    country: (initialCenterLocation?.country as string | undefined) ?? "",
    postalCode: (initialCenterLocation?.postalCode as string | undefined) ?? "",
    lat: typeof initialCenterLocation?.latitude === "number" ? String(initialCenterLocation.latitude) : "",
    lng: typeof initialCenterLocation?.longitude === "number" ? String(initialCenterLocation.longitude) : "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const latitudeRaw = formData.lat.trim();
    const longitudeRaw = formData.lng.trim();
    const latitude = latitudeRaw.length > 0 ? Number(latitudeRaw) : NaN;
    const longitude = longitudeRaw.length > 0 ? Number(longitudeRaw) : NaN;

    if (!Number.isFinite(latitude)) {
      setErrors({ latitude: tErrors("latitude") });
      setIsLoading(false);
      return;
    }
    if (!Number.isFinite(longitude)) {
      setErrors({ longitude: tErrors("longitude") });
      setIsLoading(false);
      return;
    }

    const parsed = centerLocationSchema.safeParse({
      address: formData.address,
      city: formData.city,
      postalCode: formData.postalCode,
      country: formData.country,
      latitude,
      longitude,
    });

    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === "address") next.address = tErrors("address");
        if (field === "city") next.city = tErrors("city");
        if (field === "country") next.country = tErrors("country");
        if (field === "latitude") next.latitude = tErrors("latitude");
        if (field === "longitude") next.longitude = tErrors("longitude");
      }
      setErrors(next);
      setIsLoading(false);
      return;
    }

    onSubmit({
      address: formData.address,
      city: formData.city,
      postalCode: formData.postalCode.trim().length > 0 ? formData.postalCode : undefined,
      country: formData.country,
      latitude,
      longitude,
    });

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-white/60">{t("description")}</p>

      <div>
        <LiquidInput
          label={t("address")}
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          required
        />
        {errors.address && <p className="mt-1 text-sm text-red-400">{errors.address}</p>}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <LiquidInput
            label={t("city")}
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            required
          />
          {errors.city && <p className="mt-1 text-sm text-red-400">{errors.city}</p>}
        </div>
        <LiquidInput
          label={t("postalCode")}
          value={formData.postalCode}
          onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
        />
        <div>
          <LiquidInput
            label={t("country")}
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            required
          />
          {errors.country && <p className="mt-1 text-sm text-red-400">{errors.country}</p>}
        </div>
      </div>

      {/* Map placeholder */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <MapPin className="mx-auto mb-2 h-10 w-10 text-white/30" />
            <p className="text-sm text-white/50">{t("mapPlaceholder")}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <LiquidInput
            type="number"
            label={t("latitude")}
            value={formData.lat}
            onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
            required
          />
          {errors.latitude && <p className="mt-1 text-sm text-red-400">{errors.latitude}</p>}
        </div>
        <div>
          <LiquidInput
            type="number"
            label={t("longitude")}
            value={formData.lng}
            onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
            required
          />
          {errors.longitude && <p className="mt-1 text-sm text-red-400">{errors.longitude}</p>}
        </div>
      </div>

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
