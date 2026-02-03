"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Loader2, MapPin } from "lucide-react";
import { LiquidInput } from "@/components/ui/liquid-input";
import { Button } from "@/components/ui/button";
import { createAdditionalCenter } from "@/app/[locale]/onboard/center/actions";
import { toast } from "sonner";

interface FormData {
  centerName: string;
  description: string;
  website: string;
  facebook: string;
  instagram: string;
  centerPhone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
}

export function CreateCenterForm() {
  const t = useTranslations("dashboard.center.create");
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    centerName: "",
    description: "",
    website: "",
    facebook: "",
    instagram: "",
    centerPhone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    latitude: null,
    longitude: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Basic validation
    if (!formData.centerName || formData.centerName.length < 2) {
      setErrors({ centerName: t("errors.centerNameRequired") });
      setIsLoading(false);
      return;
    }

    if (!formData.description || formData.description.length < 20) {
      setErrors({ description: t("errors.descriptionTooShort") });
      setIsLoading(false);
      return;
    }

    if (!formData.address || !formData.city || !formData.country) {
      setErrors({ address: t("errors.addressRequired") });
      setIsLoading(false);
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setErrors({ location: t("errors.locationRequired") });
      setIsLoading(false);
      return;
    }

    try {
      const result = await createAdditionalCenter(
        {
          centerName: formData.centerName,
          description: formData.description,
          website: formData.website || undefined,
          facebook: formData.facebook || undefined,
          instagram: formData.instagram || undefined,
          centerPhone: formData.centerPhone || undefined,
        },
        {
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode || undefined,
          country: formData.country,
          latitude: formData.latitude,
          longitude: formData.longitude,
        }
      );

      if (result.success) {
        toast.success(t("success"));
        router.push("/dashboard/center");
      } else {
        toast.error(result.error || t("errors.genericError"));
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error creating center:", error);
      toast.error(t("errors.genericError"));
      setIsLoading(false);
    }
  };

  const handleGeocode = async () => {
    if (!formData.address || !formData.city || !formData.country) {
      toast.error(t("errors.addressRequired"));
      return;
    }

    setIsLoading(true);
    const query = `${formData.address}, ${formData.city}, ${formData.country}`;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        setFormData({
          ...formData,
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        });
        toast.success(t("geocodeSuccess"));
      } else {
        toast.error(t("errors.geocodeFailed"));
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      toast.error(t("errors.geocodeFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Center Info */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <h2 className="mb-4 text-xl font-semibold text-white">{t("sections.info")}</h2>
        
        <div className="space-y-4">
          <div>
            <LiquidInput
              label={t("fields.centerName")}
              value={formData.centerName}
              onChange={(e) => setFormData({ ...formData, centerName: e.target.value })}
              required
            />
            {errors.centerName && <p className="mt-1 text-sm text-red-400">{errors.centerName}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white/90">
              {t("fields.description")}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 backdrop-blur-xl transition-colors focus:border-cyan-500/50 focus:outline-none"
              required
            />
            {errors.description && <p className="mt-1 text-sm text-red-400">{errors.description}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <LiquidInput
              type="tel"
              label={t("fields.phone")}
              value={formData.centerPhone}
              onChange={(e) => setFormData({ ...formData, centerPhone: e.target.value })}
            />
            <LiquidInput
              type="url"
              label={t("fields.website")}
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <LiquidInput
              label={t("fields.facebook")}
              placeholder="https://facebook.com/..."
              value={formData.facebook}
              onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
            />
            <LiquidInput
              label={t("fields.instagram")}
              placeholder="@username"
              value={formData.instagram}
              onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <h2 className="mb-4 text-xl font-semibold text-white">{t("sections.location")}</h2>
        
        <div className="space-y-4">
          <div>
            <LiquidInput
              label={t("fields.address")}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <LiquidInput
              label={t("fields.city")}
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
            />
            <LiquidInput
              label={t("fields.postalCode")}
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
            />
            <LiquidInput
              label={t("fields.country")}
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              required
            />
          </div>

          {errors.address && <p className="text-sm text-red-400">{errors.address}</p>}

          <div className="flex items-end gap-4">
            <div className="flex-1">
              <LiquidInput
                type="number"
                step="any"
                label={t("fields.latitude")}
                value={formData.latitude?.toString() || ""}
                onChange={(e) =>
                  setFormData({ ...formData, latitude: parseFloat(e.target.value) || null })
                }
                required
              />
            </div>
            <div className="flex-1">
              <LiquidInput
                type="number"
                step="any"
                label={t("fields.longitude")}
                value={formData.longitude?.toString() || ""}
                onChange={(e) =>
                  setFormData({ ...formData, longitude: parseFloat(e.target.value) || null })
                }
                required
              />
            </div>
            <Button
              type="button"
              onClick={handleGeocode}
              disabled={isLoading || !formData.address || !formData.city}
              className="rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-900 hover:bg-cyan-400"
            >
              <MapPin className="h-5 w-5" />
            </Button>
          </div>
          {errors.location && <p className="text-sm text-red-400">{errors.location}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          onClick={() => router.push("/dashboard/center")}
          disabled={isLoading}
          className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white hover:bg-white/10"
        >
          {t("cancel")}
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-900 hover:bg-cyan-400 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {t("creating")}
            </>
          ) : (
            t("create")
          )}
        </Button>
      </div>
    </form>
  );
}
