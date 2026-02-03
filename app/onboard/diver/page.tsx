"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, User, Settings, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOnboardStore } from "@/stores";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n/use-translations";

const STEP_DEFS = [
  { key: "profile", icon: User },
  { key: "preferences", icon: Settings },
  { key: "review", icon: CheckCircle },
] as const;

const CERTIFICATION_LEVEL_KEYS = [
  "none",
  "openWater",
  "advancedOpenWater",
  "rescueDiver",
  "divemaster",
  "instructor",
] as const;

const CERTIFICATION_ORG_KEYS = ["padi", "ssi", "naui", "cmas", "bsac", "other"] as const;

const DIVE_TYPE_KEYS = [
  "reef",
  "wreck",
  "drift",
  "night",
  "cave",
  "deep",
  "technical",
  "photography",
] as const;

export default function DiverOnboardPage() {
  const router = useRouter();
  const t = useTranslations("onboardDiver");
  const { diverProfile, diverPreferences, setDiverProfile, setDiverPreferences, resetDiverData } =
    useOnboardStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile form state
  const [profile, setProfile] = useState({
    displayName: diverProfile.displayName || "",
    bio: diverProfile.bio || "",
    phone: diverProfile.phone || "",
    certificationLevel: diverProfile.certificationLevel || "",
    certificationOrg: diverProfile.certificationOrg || "",
    totalDives: diverProfile.totalDives?.toString() || "",
  });

  // Preferences form state
  const [preferences, setPreferences] = useState({
    preferredDiveTypes: diverPreferences.preferredDiveTypes || [],
    notifications: diverPreferences.notificationPreferences || {
      email: true,
      push: false,
      sms: false,
    },
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleDiveType = (type: string) => {
    setPreferences((prev) => ({
      ...prev,
      preferredDiveTypes: prev.preferredDiveTypes.includes(type)
        ? prev.preferredDiveTypes.filter((t) => t !== type)
        : [...prev.preferredDiveTypes, type],
    }));
  };

  const toggleNotification = (key: "email" | "push" | "sms") => {
    setPreferences((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: !prev.notifications[key] },
    }));
  };

  const nextStep = () => {
    if (currentStep === 0) {
      setDiverProfile({
        displayName: profile.displayName,
        bio: profile.bio,
        phone: profile.phone,
        certificationLevel: profile.certificationLevel,
        certificationOrg: profile.certificationOrg,
        totalDives: profile.totalDives ? parseInt(profile.totalDives) : undefined,
      });
    } else if (currentStep === 1) {
      setDiverPreferences({
        preferredDiveTypes: preferences.preferredDiveTypes,
        notificationPreferences: preferences.notifications,
      });
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEP_DEFS.length - 1));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Save to API
      const response = await fetch("/api/diver/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          totalDives: profile.totalDives ? parseInt(profile.totalDives) : null,
          preferredDiveTypes: preferences.preferredDiveTypes,
          notificationPreferences: preferences.notifications,
        }),
      });

      if (response.ok) {
        resetDiverData();
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">
                {t("form.displayName")}
              </label>
              <Input
                name="displayName"
                value={profile.displayName}
                onChange={handleProfileChange}
                placeholder={t("form.displayNameHint")}
                className="h-12 rounded-xl border-white/10 bg-white/5 text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">{t("form.bio")}</label>
              <textarea
                name="bio"
                value={profile.bio}
                onChange={handleProfileChange}
                placeholder={t("form.bioPlaceholder")}
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-cyan-500/50 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">
                  {t("form.certificationLevel")}
                </label>
                <select
                  value={profile.certificationLevel}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, certificationLevel: e.target.value }))
                  }
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white focus:border-cyan-500/50 focus:outline-none"
                >
                  <option value="">{t("form.selectLevel")}</option>
                  {CERTIFICATION_LEVEL_KEYS.map((levelKey) => (
                    <option key={levelKey} value={levelKey}>
                      {t(`certificationLevels.${levelKey}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">
                  {t("form.organization")}
                </label>
                <select
                  value={profile.certificationOrg}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, certificationOrg: e.target.value }))
                  }
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white focus:border-cyan-500/50 focus:outline-none"
                >
                  <option value="">{t("form.selectOrg")}</option>
                  {CERTIFICATION_ORG_KEYS.map((orgKey) => (
                    <option key={orgKey} value={orgKey}>
                      {t(`certificationOrgs.${orgKey}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/70">
                {t("form.totalDives")}
              </label>
              <Input
                name="totalDives"
                type="number"
                value={profile.totalDives}
                onChange={handleProfileChange}
                placeholder={t("form.totalDivesPlaceholder")}
                className="h-12 rounded-xl border-white/10 bg-white/5 text-white"
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-8">
            <div>
              <label className="mb-4 block text-sm font-medium text-white/70">
                {t("form.diveTypesQuestion")}
              </label>
              <div className="flex flex-wrap gap-2">
                {DIVE_TYPE_KEYS.map((typeKey) => (
                  <button
                    key={typeKey}
                    type="button"
                    onClick={() => toggleDiveType(typeKey)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm transition-all",
                      preferences.preferredDiveTypes.includes(typeKey)
                        ? "border-cyan-500 bg-cyan-500/20 text-cyan-400"
                        : "border-white/10 bg-white/5 text-white/60 hover:border-white/20"
                    )}
                  >
                    {t(`diveTypes.${typeKey}`)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-4 block text-sm font-medium text-white/70">
                {t("form.notifications")}
              </label>
              <div className="space-y-3">
                {[
                  { key: "email" as const, label: t("form.emailNotifications") },
                  { key: "push" as const, label: t("form.pushNotifications") },
                  { key: "sms" as const, label: t("form.smsNotifications") },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <span className="text-white/70">{label}</span>
                    <button
                      type="button"
                      onClick={() => toggleNotification(key)}
                      className={cn(
                        "relative h-6 w-11 rounded-full transition-colors",
                        preferences.notifications[key] ? "bg-cyan-500" : "bg-white/20"
                      )}
                    >
                      <span
                        className={cn(
                          "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                          preferences.notifications[key] && "translate-x-5"
                        )}
                      />
                    </button>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-400" />
            <h3 className="text-2xl font-bold text-white">{t("review.title")}</h3>
            <p className="text-white/60">
              {t("review.description")}
            </p>
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-left">
              <h4 className="mb-4 font-semibold text-white">{t("review.summaryTitle")}</h4>
              <dl className="space-y-2 text-sm">
                {profile.displayName && (
                  <div className="flex justify-between">
                    <dt className="text-white/50">{t("review.displayName")}</dt>
                    <dd className="text-white">{profile.displayName}</dd>
                  </div>
                )}
                {profile.certificationLevel && (
                  <div className="flex justify-between">
                    <dt className="text-white/50">{t("review.certification")}</dt>
                    <dd className="text-white">
                      {(CERTIFICATION_LEVEL_KEYS as readonly string[]).includes(profile.certificationLevel)
                        ? t(`certificationLevels.${profile.certificationLevel}`)
                        : profile.certificationLevel}{" "}
                      {profile.certificationOrg
                        ? `(${
                            (CERTIFICATION_ORG_KEYS as readonly string[]).includes(profile.certificationOrg)
                              ? t(`certificationOrgs.${profile.certificationOrg}`)
                              : profile.certificationOrg
                          })`
                        : ""}
                    </dd>
                  </div>
                )}
                {profile.totalDives && (
                  <div className="flex justify-between">
                    <dt className="text-white/50">{t("review.totalDives")}</dt>
                    <dd className="text-white">{profile.totalDives}</dd>
                  </div>
                )}
                {preferences.preferredDiveTypes.length > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-white/50">{t("review.interests")}</dt>
                    <dd className="text-white">
                      {preferences.preferredDiveTypes
                        .map((typeKey) => t(`diveTypes.${typeKey}`))
                        .join(", ")}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-20">
      <div className="w-full max-w-2xl">
        {/* Progress Steps */}
        <div className="mb-12 flex items-center justify-center gap-4">
          {STEP_DEFS.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div key={step.key} className="flex items-center">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all",
                    isCompleted && "border-green-500 bg-green-500/20",
                    isActive && "border-cyan-500 bg-cyan-500/20",
                    !isActive && !isCompleted && "border-white/20 bg-white/5"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5 text-green-400" />
                  ) : (
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        isActive ? "text-cyan-400" : "text-white/40"
                      )}
                    />
                  )}
                </div>
                {index < STEP_DEFS.length - 1 && (
                  <div
                    className={cn(
                      "mx-2 h-0.5 w-16",
                      isCompleted ? "bg-green-500" : "bg-white/20"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Form Card */}
        <motion.div
          className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="h-12 rounded-xl border-white/10 bg-white/5 text-white disabled:opacity-30"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("navigation.back")}
            </Button>

            {currentStep < STEP_DEFS.length - 1 ? (
              <Button
                onClick={nextStep}
                className="h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500"
              >
                {t("navigation.continue")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Check className="mr-2 h-5 w-5" />
                )}
                {t("navigation.complete")}
              </Button>
            )}
          </div>
        </motion.div>

        {/* Skip option */}
        <p className="mt-6 text-center text-sm text-white/40">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-white/60 hover:text-white underline"
          >
            {t("navigation.skip")}
          </button>{" "}
          {t("navigation.skipNote")}
        </p>
      </div>
    </div>
  );
}
