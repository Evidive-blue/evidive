"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { StepProgressBar } from "./StepProgressBar";
import { Step1PersonalInfo } from "./Step1PersonalInfo";
import { Step2CenterInfo } from "./Step2CenterInfo";
import { Step3LegalInfo } from "./Step3LegalInfo";
import { Step4Confirmation } from "./Step4Confirmation";
import { useCenterRegistrationStore } from "@/stores/centerRegistrationStore";

export function CenterRegistrationWizard() {
  const t = useTranslations("centerRegistration");
  const { currentStep, setCurrentStep, _hasHydrated } = useCenterRegistrationStore();

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  // Show loading while hydrating
  if (!_hasHydrated) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
      </div>
    );
  }

  const stepLabels = [
    t("steps.personal"),
    t("steps.center"),
    t("steps.legal"),
    t("steps.confirmation"),
  ];

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1PersonalInfo onNext={handleNext} />;
      case 2:
        return <Step2CenterInfo onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <Step3LegalInfo onNext={handleNext} onBack={handleBack} />;
      case 4:
        return <Step4Confirmation onBack={handleBack} />;
      default:
        return <Step1PersonalInfo onNext={handleNext} />;
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress Bar */}
      <div className="mb-8">
        <StepProgressBar
          currentStep={currentStep}
          totalSteps={4}
          stepLabels={stepLabels}
        />
      </div>

      {/* Step Content */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
