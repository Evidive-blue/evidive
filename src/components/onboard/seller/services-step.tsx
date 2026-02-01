"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Plus, Trash2, Package, FileText, DollarSign, Clock, Loader2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useOnboardStore } from "@/stores/onboard-store";
import type { SellerServiceData } from "@/lib/validations/seller";
import { cn } from "@/lib/utils";

type ServiceForm = {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: string;
  maxParticipants: string;
};

interface SellerServicesStepProps {
  isDrawer?: boolean;
  onNext?: () => void;
  onBack?: () => void;
}

// Convert store services to form format
function storeToForm(storeServices: SellerServiceData[]): ServiceForm[] {
  if (storeServices.length === 0) {
    return [{ id: "1", name: "", description: "", price: "", duration: "60", maxParticipants: "1" }];
  }
  return storeServices.map((s, i) => ({
    id: i.toString(),
    name: s.name,
    description: s.description,
    price: s.price.toString(),
    duration: s.duration.toString(),
    maxParticipants: s.maxParticipants?.toString() || "1",
  }));
}

export function SellerServicesStep({
  isDrawer = false,
  onNext,
  onBack,
}: SellerServicesStepProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const {
    sellerAccount,
    sellerProfile,
    sellerServices,
    setSellerServices,
    _hasHydrated,
  } = useOnboardStore();

  useEffect(() => {
    if (_hasHydrated && (!sellerAccount?.email || !sellerProfile?.bio)) {
      if (isDrawer && onBack) {
        onBack();
      } else {
        router.push(`/${locale}/onboard/seller/account`);
      }
    }
  }, [_hasHydrated, sellerAccount?.email, sellerProfile?.bio, isDrawer, locale, onBack, router]);

  // Show loading until hydrated and required data is present
  if (!_hasHydrated || !sellerAccount?.email || !sellerProfile?.bio) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Render the actual form after hydration - this ensures useState initializer has correct values
  return (
    <ServicesForm
      isDrawer={isDrawer}
      onNext={onNext}
      onBack={onBack}
      locale={locale}
      initialServices={sellerServices}
      setSellerServices={setSellerServices}
    />
  );
}

// Separate form component that mounts after hydration
function ServicesForm({
  isDrawer,
  onNext,
  onBack,
  locale,
  initialServices,
  setSellerServices,
}: {
  isDrawer: boolean;
  onNext?: () => void;
  onBack?: () => void;
  locale: string;
  initialServices: SellerServiceData[];
  setSellerServices: (services: SellerServiceData[]) => void;
}) {
  const t = useTranslations("onboard.seller.services");
  const tCommon = useTranslations("onboard.seller");
  const router = useRouter();

  // Initialize with store data - this runs only after hydration
  const [services, setServices] = useState<ServiceForm[]>(() => storeToForm(initialServices));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const addServiceForm = () => {
    setServices([
      ...services,
      { id: Date.now().toString(), name: "", description: "", price: "", duration: "60", maxParticipants: "1" },
    ]);
  };

  const removeServiceForm = (id: string) => {
    if (services.length > 1) {
      setServices(services.filter((s) => s.id !== id));
    }
  };

  const updateServiceForm = (id: string, field: keyof ServiceForm, value: string) => {
    setServices(
      services.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
    // Clear error for this service
    if (errors[`${id}-${field}`]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`${id}-${field}`];
        return newErrors;
      });
    }
  };

  const validateServices = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    services.forEach((service) => {
      if (!service.name || service.name.length < 3) {
        newErrors[`${service.id}-name`] = "Service name must be at least 3 characters";
        isValid = false;
      }
      if (!service.description || service.description.length < 10) {
        newErrors[`${service.id}-description`] = "Description must be at least 10 characters";
        isValid = false;
      }
      if (!service.price || parseFloat(service.price) < 0) {
        newErrors[`${service.id}-price`] = "Price must be positive";
        isValid = false;
      }
      if (!service.duration || parseInt(service.duration) < 15) {
        newErrors[`${service.id}-duration`] = "Duration must be at least 15 minutes";
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!validateServices()) {
      setIsLoading(false);
      return;
    }

    const serviceDataList: SellerServiceData[] = services.map((service) => ({
      name: service.name,
      description: service.description,
      price: parseFloat(service.price),
      duration: parseInt(service.duration),
      maxParticipants: parseInt(service.maxParticipants) || 1,
    }));

    setSellerServices(serviceDataList);

    if (onNext) {
      onNext();
    } else {
      router.push(`/${locale}/onboard/seller/payments`);
    }
  };

  return (
    <div
      className={cn(
        "rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl",
        isDrawer && "p-6"
      )}
    >
      <p className="mb-8 text-center text-white/60">{t("description")}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-6">
          {services.map((service, serviceIndex) => (
            <div
              key={service.id}
              className="relative rounded-xl border border-white/10 bg-white/5 p-4"
            >
              {services.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeServiceForm(service.id)}
                  className="absolute right-2 top-2 rounded-lg p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}

              <div className="mb-2 text-sm font-medium text-white/60">
                Service {serviceIndex + 1}
              </div>

              <div className="space-y-3">
                <div>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <Input
                      type="text"
                      placeholder={t("serviceName")}
                      value={service.name}
                      onChange={(e) => updateServiceForm(service.id, "name", e.target.value)}
                      className={`h-12 rounded-lg border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40 ${
                        errors[`${service.id}-name`] ? "border-red-500" : ""
                      }`}
                    />
                  </div>
                  {errors[`${service.id}-name`] && (
                    <p className="mt-1 text-xs text-red-400">{errors[`${service.id}-name`]}</p>
                  )}
                </div>

                <div>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                    <textarea
                      placeholder={t("serviceDescription")}
                      value={service.description}
                      onChange={(e) => updateServiceForm(service.id, "description", e.target.value)}
                      className={`min-h-20 w-full rounded-lg border bg-white/5 p-3 pl-10 text-white placeholder:text-white/40 ${
                        errors[`${service.id}-description`] ? "border-red-500" : "border-white/10"
                      }`}
                    />
                  </div>
                  {errors[`${service.id}-description`] && (
                    <p className="mt-1 text-xs text-red-400">{errors[`${service.id}-description`]}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                      <Input
                        type="number"
                        placeholder={t("price")}
                        value={service.price}
                        onChange={(e) => updateServiceForm(service.id, "price", e.target.value)}
                        className={`h-12 rounded-lg border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40 ${
                          errors[`${service.id}-price`] ? "border-red-500" : ""
                        }`}
                        min={0}
                      />
                    </div>
                    {errors[`${service.id}-price`] && (
                      <p className="mt-1 text-xs text-red-400">{errors[`${service.id}-price`]}</p>
                    )}
                  </div>

                  <div>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                      <Input
                        type="number"
                        placeholder={t("duration")}
                        value={service.duration}
                        onChange={(e) => updateServiceForm(service.id, "duration", e.target.value)}
                        className={`h-12 rounded-lg border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40 ${
                          errors[`${service.id}-duration`] ? "border-red-500" : ""
                        }`}
                        min={15}
                      />
                    </div>
                    {errors[`${service.id}-duration`] && (
                      <p className="mt-1 text-xs text-red-400">{errors[`${service.id}-duration`]}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={addServiceForm}
          className="h-12 w-full rounded-xl border-dashed border-white/20 bg-transparent text-white/60 hover:border-white/40 hover:text-white"
        >
          <Plus className="mr-2 h-5 w-5" />
          {t("addService")}
        </Button>

        <div className="flex gap-4">
          {isDrawer && onBack ? (
            <Button
              type="button"
              variant="outline"
              className="h-14 flex-1 rounded-xl border-white/20 bg-white/5 text-white"
              onClick={onBack}
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              {tCommon("steps.profile")}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="h-14 flex-1 rounded-xl border-white/20 bg-white/5 text-white"
              asChild
            >
              <Link href="/onboard/seller/profile">
                <ArrowLeft className="mr-2 h-5 w-5" />
                {tCommon("steps.profile")}
              </Link>
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading}
            className="h-14 flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-lg font-semibold disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                {tCommon("steps.payments")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
