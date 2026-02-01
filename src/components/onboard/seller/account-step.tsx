"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, User, Mail, Phone, Lock, Loader2 } from "lucide-react";
import { useOnboardStore } from "@/stores/onboard-store";
import { sellerAccountSchema } from "@/lib/validations/seller";
import { cn } from "@/lib/utils";

interface SellerAccountStepProps {
  isDrawer?: boolean;
  onNext?: () => void;
}

export function SellerAccountStep({ isDrawer = false, onNext }: SellerAccountStepProps) {
  const t = useTranslations("onboard.seller.account");
  const tCommon = useTranslations("onboard.seller");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const { sellerAccount, setSellerAccount } = useOnboardStore();

  const [formData, setFormData] = useState({
    fullName: sellerAccount?.fullName || "",
    email: sellerAccount?.email || "",
    phone: sellerAccount?.phone || "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const nextStep = () => {
    if (onNext) {
      onNext();
      return;
    }
    router.push(`/${locale}/onboard/seller/profile`);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const parsed = sellerAccountSchema.safeParse(formData);
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

    setSellerAccount({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });

    nextStep();
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
        <div className="space-y-4">
          <div>
            <div className="relative">
              <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
              <Input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder={t("fullName")}
                className={`h-14 rounded-xl border-white/10 bg-white/5 pl-12 text-white placeholder:text-white/40 ${
                  errors.fullName ? "border-red-500" : ""
                }`}
                required
              />
            </div>
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-400">{errors.fullName}</p>
            )}
          </div>

          <div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t("email")}
                className={`h-14 rounded-xl border-white/10 bg-white/5 pl-12 text-white placeholder:text-white/40 ${
                  errors.email ? "border-red-500" : ""
                }`}
                required
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email}</p>
            )}
          </div>

          <div>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={t("phone")}
                className="h-14 rounded-xl border-white/10 bg-white/5 pl-12 text-white placeholder:text-white/40"
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={t("password")}
                className={`h-14 rounded-xl border-white/10 bg-white/5 pl-12 text-white placeholder:text-white/40 ${
                  errors.password ? "border-red-500" : ""
                }`}
                required
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-400">{errors.password}</p>
            )}
          </div>

          <div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
              <Input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder={t("confirmPassword")}
                className={`h-14 rounded-xl border-white/10 bg-white/5 pl-12 text-white placeholder:text-white/40 ${
                  errors.confirmPassword ? "border-red-500" : ""
                }`}
                required
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="h-14 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-lg font-semibold disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              {tCommon("steps.profile")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
