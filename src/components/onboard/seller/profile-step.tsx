"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight, FileText, Award, Globe, X, Plus, Loader2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useOnboardStore } from "@/stores/onboard-store";
import { cn } from "@/lib/utils";

const AVAILABLE_LANGUAGES = ["fr", "en", "es", "it"] as const;
const LANGUAGE_NAMES: Record<string, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
  it: "Italiano",
};

interface SellerProfileStepProps {
  isDrawer?: boolean;
  onNext?: () => void;
  onBack?: () => void;
}

export function SellerProfileStep({
  isDrawer = false,
  onNext,
  onBack,
}: SellerProfileStepProps) {
  const t = useTranslations("onboard.seller.profile");
  const tCommon = useTranslations("onboard.seller");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const { sellerAccount, sellerProfile, setSellerProfile, _hasHydrated } = useOnboardStore();

  const [newCertification, setNewCertification] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (_hasHydrated && !sellerAccount?.email) {
      if (isDrawer && onBack) {
        onBack();
      } else {
        router.push(`/${locale}/onboard/seller/account`);
      }
    }
  }, [_hasHydrated, sellerAccount?.email, isDrawer, locale, onBack, router]);

  if (!_hasHydrated || !sellerAccount?.email) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Derived values from store with defaults
  const bio = sellerProfile?.bio || "";
  const certifications = sellerProfile?.certifications || [];
  const languages = sellerProfile?.languages || [locale];

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSellerProfile({ bio: e.target.value });
    if (errors.bio) {
      setErrors((prev) => ({ ...prev, bio: "" }));
    }
  };

  const addCertification = () => {
    if (newCertification.trim() && !certifications.includes(newCertification.trim())) {
      setSellerProfile({
        certifications: [...certifications, newCertification.trim()],
      });
      setNewCertification("");
    }
  };

  const removeCertification = (cert: string) => {
    setSellerProfile({
      certifications: certifications.filter((c) => c !== cert),
    });
  };

  const toggleLanguage = (lang: typeof AVAILABLE_LANGUAGES[number]) => {
    const currentLanguages = languages as typeof AVAILABLE_LANGUAGES[number][];
    setSellerProfile({
      languages: currentLanguages.includes(lang)
        ? currentLanguages.filter((l) => l !== lang)
        : [...currentLanguages, lang],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Basic validation
    if (bio.length < 10) {
      setErrors({ bio: "Bio must be at least 10 characters" });
      setIsLoading(false);
      return;
    }

    if (certifications.length === 0) {
      setErrors({ certifications: "At least one certification is required" });
      setIsLoading(false);
      return;
    }

    if (languages.length === 0) {
      setErrors({ languages: "At least one language is required" });
      setIsLoading(false);
      return;
    }

    // Data is already in store, just navigate
    if (onNext) {
      onNext();
    } else {
      router.push(`/${locale}/onboard/seller/services`);
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
          {/* Bio */}
          <div>
            <div className="relative">
              <FileText className="absolute left-4 top-4 h-5 w-5 text-white/40" />
              <textarea
                value={bio}
                onChange={handleBioChange}
                placeholder={t("bioPlaceholder")}
                className={`min-h-32 w-full rounded-xl border bg-white/5 p-4 pl-12 text-white placeholder:text-white/40 ${
                  errors.bio ? "border-red-500" : "border-white/10"
                }`}
                required
              />
            </div>
            {errors.bio && (
              <p className="mt-1 text-sm text-red-400">{errors.bio}</p>
            )}
          </div>

          {/* Certifications */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm text-white/60">
              <Award className="h-4 w-4" />
              {t("certifications")}
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {certifications.map((cert) => (
                <span
                  key={cert}
                  className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-sm text-emerald-400"
                >
                  {cert}
                  <button
                    type="button"
                    onClick={() => removeCertification(cert)}
                    className="ml-1 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="text"
                value={newCertification}
                onChange={(e) => setNewCertification(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCertification();
                  }
                }}
                placeholder={t("addCertification")}
                className="h-12 flex-1 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/40"
              />
              <Button
                type="button"
                onClick={addCertification}
                variant="outline"
                className="h-12 rounded-xl border-white/20 bg-white/5 text-white"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {errors.certifications && (
              <p className="mt-1 text-sm text-red-400">{errors.certifications}</p>
            )}
          </div>

          {/* Languages */}
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm text-white/60">
              <Globe className="h-4 w-4" />
              {t("languages")}
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={`rounded-full px-4 py-2 text-sm transition-colors ${
                    languages.includes(lang)
                      ? "bg-emerald-500 text-white"
                      : "bg-white/10 text-white/60 hover:bg-white/20"
                  }`}
                >
                  {LANGUAGE_NAMES[lang]}
                </button>
              ))}
            </div>
            {errors.languages && (
              <p className="mt-1 text-sm text-red-400">{errors.languages}</p>
            )}
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
              <Link href="/onboard/seller/account">
                <ArrowLeft className="mr-2 h-5 w-5" />
                {tCommon("steps.account")}
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
                {tCommon("steps.services")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
