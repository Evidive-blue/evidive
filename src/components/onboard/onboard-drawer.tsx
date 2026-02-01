"use client";

import { useEffect, useId } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Building2, Store, Waves, X } from "lucide-react";
import { Drawer, DrawerBody, DrawerHeader } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useOnboardStore,
  type OnboardDrawerIntent,
  type OnboardDrawerStepKey,
  type OnboardDrawerType,
} from "@/stores/onboard-store";
import { OnboardStepper } from "@/components/onboard/onboard-stepper";
import { DiverAccountStep } from "@/components/onboard/diver/account-step";
import { DiverPreferencesStep } from "@/components/onboard/diver/preferences-step";
import { DiverReviewStep } from "@/components/onboard/diver/review-step";
import { SellerAccountStep } from "@/components/onboard/seller/account-step";
import { SellerPaymentsStep } from "@/components/onboard/seller/payments-step";
import { SellerProfileStep } from "@/components/onboard/seller/profile-step";
import { SellerReviewStep } from "@/components/onboard/seller/review-step";
import { SellerServicesStep } from "@/components/onboard/seller/services-step";
import { AccountStep as CenterAccountStep } from "@/components/onboard/steps/account-step";
import { DocumentsStep as CenterDocumentsStep } from "@/components/onboard/steps/documents-step";
import { InfoStep as CenterInfoStep } from "@/components/onboard/steps/info-step";
import { LocationStep as CenterLocationStep } from "@/components/onboard/steps/location-step";
import { PaymentsStep as CenterPaymentsStep } from "@/components/onboard/steps/payments-step";
import { ReviewStep as CenterReviewStep } from "@/components/onboard/steps/review-step";

const drawerStepMap = {
  diver: ["account", "preferences", "review"],
  seller: ["account", "profile", "services", "payments", "review"],
  center: ["account", "info", "location", "documents", "payments", "review"],
} as const satisfies Record<Exclude<OnboardDrawerType, "role">, readonly OnboardDrawerStepKey[]>;

function getInitialStep(type: OnboardDrawerType, intent: OnboardDrawerIntent): OnboardDrawerStepKey {
  if (intent === "upgrade") {
    if (type === "seller") return "profile";
    if (type === "center") return "info";
    return "preferences";
  }
  return "account";
}

export function OnboardDrawer() {
  const t = useTranslations("onboard");
  const tImages = useTranslations("images");
  const { data: session } = useSession();
  const titleId = useId();

  const {
    isDrawerOpen,
    drawerType,
    drawerIntent,
    drawerStep,
    closeDrawer,
    setDrawerType,
    setDrawerStep,
    setDiverAccount,
    setSellerAccount,
    setCenterAccount,
  } = useOnboardStore();

  useEffect(() => {
    if (!isDrawerOpen || drawerType === "role") return;
    if (!drawerStep) {
      setDrawerStep(getInitialStep(drawerType, drawerIntent));
    }
  }, [drawerIntent, drawerStep, drawerType, isDrawerOpen, setDrawerStep]);

  useEffect(() => {
    if (!isDrawerOpen || drawerIntent !== "upgrade" || !session?.user) return;
    const fallbackName =
      session.user.name ?? session.user.email?.split("@")[0] ?? "";
    const baseAccount = {
      fullName: fallbackName,
      email: session.user.email ?? "",
      phone: undefined,
    };
    if (drawerType === "seller") {
      setSellerAccount(baseAccount);
    } else if (drawerType === "center") {
      setCenterAccount(baseAccount);
    } else if (drawerType === "diver") {
      setDiverAccount(baseAccount);
    }
  }, [
    drawerIntent,
    drawerType,
    isDrawerOpen,
    session?.user,
    setCenterAccount,
    setDiverAccount,
    setSellerAccount,
  ]);

  const steps: readonly OnboardDrawerStepKey[] =
    drawerType === "role" ? [] : drawerStepMap[drawerType];
  const currentStep = drawerStep ?? (drawerType === "role" ? null : steps[0] ?? null);
  const stepIndex = currentStep ? steps.indexOf(currentStep) : -1;

  const handleNext = () => {
    if (!currentStep) return;
    const next = steps[stepIndex + 1];
    if (next) {
      setDrawerStep(next);
    }
  };

  const handleBack = () => {
    if (!currentStep) return;
    const prev = steps[stepIndex - 1];
    if (prev) {
      setDrawerStep(prev);
      return;
    }
    setDrawerType("role");
    setDrawerStep(null);
  };

  const roleOptions = [
    {
      key: "diver",
      icon: Waves,
      gradient: "from-cyan-500/30 to-blue-500/30",
      accent: "cyan",
      hoverBorder: "hover:border-cyan-500/50",
      glow: "bg-cyan-500/10 group-hover:bg-cyan-500/20",
    },
    {
      key: "seller",
      icon: Store,
      gradient: "from-emerald-500/30 to-teal-500/30",
      accent: "emerald",
      hoverBorder: "hover:border-emerald-500/50",
      glow: "bg-emerald-500/10 group-hover:bg-emerald-500/20",
    },
    {
      key: "center",
      icon: Building2,
      gradient: "from-blue-500/30 to-indigo-500/30",
      accent: "blue",
      hoverBorder: "hover:border-blue-500/50",
      glow: "bg-blue-500/10 group-hover:bg-blue-500/20",
    },
  ] as const;

  const filteredRoles = roleOptions.filter((role) => {
    if (drawerIntent === "register") return true;
    if (!session?.user) return false;
    if (session.user.userType === "SELLER") {
      return role.key === "center";
    }
    if (session.user.userType === "DIVER") {
      return role.key === "seller" || role.key === "center";
    }
    return false;
  });

  const accentColors = {
    cyan: "bg-cyan-500",
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
  };

  const iconColors = {
    cyan: "text-cyan-400",
    emerald: "text-emerald-400",
    blue: "text-blue-400",
  };

  const stepsForStepper =
    drawerType === "role"
      ? []
      : steps.map((key) => ({
          key,
          label: t(`${drawerType}.steps.${key}`),
        }));

  return (
    <Drawer
      open={isDrawerOpen}
      onOpenChange={(open) => {
        if (!open) closeDrawer();
      }}
      ariaLabelledBy={titleId}
    >
      <DrawerHeader className="flex items-center justify-between gap-4">
        <div>
          <h2 id={titleId} className="text-lg font-semibold text-white">
            {t("title")}
          </h2>
          <p className="text-sm text-white/60">{t("subtitle")}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl text-white/80 hover:bg-white/10 hover:text-white"
          onClick={() => closeDrawer()}
          aria-label={tImages("close")}
        >
          <X className="h-5 w-5" />
        </Button>
      </DrawerHeader>

      <DrawerBody className="space-y-6">
        {drawerType === "role" ? (
          <div className="grid gap-4">
            {filteredRoles.map((role) => {
              const Icon = role.icon;
              return (
                <button
                  key={role.key}
                  type="button"
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 text-start backdrop-blur-xl transition-all",
                    role.hoverBorder,
                    "hover:bg-white/10"
                  )}
                  onClick={() => {
                    const type = role.key as OnboardDrawerType;
                    setDrawerType(type);
                    setDrawerStep(getInitialStep(type, drawerIntent));
                  }}
                >
                  <div
                    className={cn(
                      "absolute -right-6 -top-6 h-24 w-24 rounded-full blur-3xl transition-all",
                      role.glow
                    )}
                  />
                  <div className="relative">
                    <div
                      className={cn(
                        "mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br",
                        role.gradient
                      )}
                    >
                      <Icon className={cn("h-6 w-6", iconColors[role.accent])} />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-white">
                      {t(`${role.key}.title`)}
                    </h3>
                    <p className="text-sm text-white/60">
                      {t(`${role.key}.description`)}
                    </p>
                    <ul className="mt-4 space-y-1.5">
                      {["feature1", "feature2", "feature3"].map((feature) => (
                        <li
                          key={feature}
                          className="flex items-center gap-2 text-xs text-white/50"
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              accentColors[role.accent]
                            )}
                          />
                          {t(`${role.key}.${feature}`)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <>
            <OnboardStepper
              steps={stepsForStepper}
              basePath=""
              accentColor={drawerType === "seller" ? "emerald" : drawerType === "center" ? "blue" : "cyan"}
              currentStepKey={currentStep ?? undefined}
              onStepChange={(step) => setDrawerStep(step as OnboardDrawerStepKey)}
            />
            <div>
              {drawerType === "diver" && currentStep === "account" ? (
                <DiverAccountStep isDrawer onNext={handleNext} />
              ) : null}
              {drawerType === "diver" && currentStep === "preferences" ? (
                <DiverPreferencesStep isDrawer onNext={handleNext} onBack={handleBack} />
              ) : null}
              {drawerType === "diver" && currentStep === "review" ? (
                <DiverReviewStep
                  isDrawer
                  intent={drawerIntent}
                  onBack={handleBack}
                  onComplete={closeDrawer}
                />
              ) : null}

              {drawerType === "seller" && currentStep === "account" ? (
                <SellerAccountStep isDrawer onNext={handleNext} />
              ) : null}
              {drawerType === "seller" && currentStep === "profile" ? (
                <SellerProfileStep isDrawer onNext={handleNext} onBack={handleBack} />
              ) : null}
              {drawerType === "seller" && currentStep === "services" ? (
                <SellerServicesStep isDrawer onNext={handleNext} onBack={handleBack} />
              ) : null}
              {drawerType === "seller" && currentStep === "payments" ? (
                <SellerPaymentsStep isDrawer onNext={handleNext} onBack={handleBack} />
              ) : null}
              {drawerType === "seller" && currentStep === "review" ? (
                <SellerReviewStep
                  isDrawer
                  intent={drawerIntent}
                  onBack={handleBack}
                  onComplete={closeDrawer}
                />
              ) : null}

              {drawerType === "center" && currentStep === "account" ? (
                <CenterAccountStep isDrawer onNext={handleNext} />
              ) : null}
              {drawerType === "center" && currentStep === "info" ? (
                <CenterInfoStep isDrawer onNext={handleNext} onBack={handleBack} />
              ) : null}
              {drawerType === "center" && currentStep === "location" ? (
                <CenterLocationStep isDrawer onNext={handleNext} onBack={handleBack} />
              ) : null}
              {drawerType === "center" && currentStep === "documents" ? (
                <CenterDocumentsStep isDrawer onNext={handleNext} onBack={handleBack} />
              ) : null}
              {drawerType === "center" && currentStep === "payments" ? (
                <CenterPaymentsStep isDrawer onNext={handleNext} onBack={handleBack} />
              ) : null}
              {drawerType === "center" && currentStep === "review" ? (
                <CenterReviewStep
                  isDrawer
                  intent={drawerIntent}
                  onBack={handleBack}
                  onComplete={closeDrawer}
                />
              ) : null}
            </div>
          </>
        )}
      </DrawerBody>
    </Drawer>
  );
}
