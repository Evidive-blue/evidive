"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Loader2 } from "lucide-react";
import { LiquidInput } from "@/components/ui/liquid-input";
import { useOnboardStore } from "@/stores/onboard-store";
import { centerAccountSchema } from "@/lib/validations/center";

interface CenterAccountStepProps {
  isDrawer?: boolean;
  onNext?: () => void;
}

export function AccountStep({ onNext }: CenterAccountStepProps) {
  const t = useTranslations("onboard.center.account");
  const router = useRouter();

  const { centerAccount, setCenterAccount } = useOnboardStore();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: centerAccount?.email || "",
    password: "",
    confirmPassword: "",
    fullName: centerAccount?.fullName || "",
    phone: centerAccount?.phone || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const nextStep = () => {
    if (onNext) {
      onNext();
      return;
    }
    router.push("/onboard/center/info");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const parsed = centerAccountSchema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    setCenterAccount({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });

    nextStep();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-white/60">{t("description")}</p>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <LiquidInput
            label={t("fullName")}
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
          />
          {errors.fullName && <p className="mt-1 text-sm text-red-400">{errors.fullName}</p>}
        </div>
        <div>
          <LiquidInput
            type="tel"
            label={t("phone")}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          {errors.phone && <p className="mt-1 text-sm text-red-400">{errors.phone}</p>}
        </div>
      </div>

      <div>
        <LiquidInput
          type="email"
          label={t("email")}
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <LiquidInput
            type="password"
            label={t("password")}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password}</p>}
        </div>
        <div>
          <LiquidInput
            type="password"
            label={t("confirmPassword")}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
          />
          {errors.confirmPassword && <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>}
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
