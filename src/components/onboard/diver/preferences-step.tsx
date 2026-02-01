"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, Award, Hash, Globe, Loader2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useOnboardStore } from "@/stores/onboard-store";
import { cn } from "@/lib/utils";

interface DiverPreferencesStepProps {
  isDrawer?: boolean;
  onNext?: () => void;
  onBack?: () => void;
}

export function DiverPreferencesStep({
  isDrawer = false,
  onNext,
  onBack,
}: DiverPreferencesStepProps) {
  const t = useTranslations("onboard.diver.preferences");
  const tCommon = useTranslations("onboard.diver");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const { diverAccount, diverPreferences, setDiverPreferences, _hasHydrated } = useOnboardStore();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (_hasHydrated && !diverAccount?.email) {
      if (isDrawer && onBack) {
        onBack();
      } else {
        router.push(`/${locale}/onboard/diver/account`);
      }
    }
  }, [_hasHydrated, diverAccount?.email, isDrawer, locale, onBack, router]);

  // Derive totalDives as string from store (for input binding)
  const totalDivesValue = diverPreferences?.totalDives?.toString() || "";

  if (!_hasHydrated || !diverAccount?.email) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "totalDives") {
      // Store as number directly
      setDiverPreferences({ totalDives: value ? parseInt(value) : undefined });
    } else {
      setDiverPreferences({ [name]: value || undefined });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Ensure preferredLanguage is set
    if (!diverPreferences?.preferredLanguage) {
      setDiverPreferences({
        preferredLanguage: locale as "fr" | "en" | "es" | "it",
      });
    }

    // Navigate to review step
    if (onNext) {
      onNext();
    } else {
      router.push(`/${locale}/onboard/diver/review`);
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
        <div className="space-y-4">
          <div className="relative">
            <Award className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
            <Input
              type="text"
              name="certificationLevel"
              value={diverPreferences?.certificationLevel || ""}
              onChange={handleChange}
              placeholder={t("certificationLevel")}
              className="h-14 rounded-xl border-white/10 bg-white/5 pl-12 text-white placeholder:text-white/40"
            />
          </div>

          <div className="relative">
            <Award className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
            <Input
              type="text"
              name="certificationOrg"
              value={diverPreferences?.certificationOrg || ""}
              onChange={handleChange}
              placeholder={t("certificationOrg")}
              className="h-14 rounded-xl border-white/10 bg-white/5 pl-12 text-white placeholder:text-white/40"
            />
          </div>

          <div className="relative">
            <Hash className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
            <Input
              type="number"
              name="totalDives"
              value={totalDivesValue}
              onChange={handleChange}
              placeholder={t("totalDives")}
              className="h-14 rounded-xl border-white/10 bg-white/5 pl-12 text-white placeholder:text-white/40"
              min={0}
            />
          </div>

          <div className="relative">
            <Globe className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
            <select
              name="preferredLanguage"
              value={diverPreferences?.preferredLanguage || locale}
              onChange={handleChange}
              className="h-14 w-full rounded-xl border border-white/10 bg-white/5 pl-12 pr-4 text-white"
            >
              <option value="fr" className="bg-slate-900">
                Français
              </option>
              <option value="en" className="bg-slate-900">
                English
              </option>
              <option value="es" className="bg-slate-900">
                Español
              </option>
              <option value="it" className="bg-slate-900">
                Italiano
              </option>
            </select>
          </div>
        </div>

        <div className="flex gap-4">
          {isDrawer && onBack ? (
            <Button
              type="button"
              variant="outline"
              className="h-14 flex-1 rounded-xl border-white/20 bg-white/5 text-white"
              onClick={onBack}
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              {tCommon("steps.account")}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="h-14 flex-1 rounded-xl border-white/20 bg-white/5 text-white"
              asChild
            >
              <Link href="/onboard/diver/account">
                <ArrowLeft className="mr-2 h-5 w-5" />
                {tCommon("steps.account")}
              </Link>
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading}
            className="h-14 flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-lg font-semibold disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                {tCommon("steps.review")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
