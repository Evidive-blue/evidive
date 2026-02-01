"use client";

import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { AccountStep } from "@/components/onboard/steps/account-step";
import { InfoStep } from "@/components/onboard/steps/info-step";
import { LocationStep } from "@/components/onboard/steps/location-step";
import { DocumentsStep } from "@/components/onboard/steps/documents-step";
import { PaymentsStep } from "@/components/onboard/steps/payments-step";
import { ReviewStep } from "@/components/onboard/steps/review-step";

const STEPS = ["account", "info", "location", "documents", "payments", "review"] as const;
type Step = (typeof STEPS)[number];

const STEP_COMPONENTS: Record<Step, React.ComponentType> = {
  account: AccountStep,
  info: InfoStep,
  location: LocationStep,
  documents: DocumentsStep,
  payments: PaymentsStep,
  review: ReviewStep,
};

export default function OnboardStepPage() {
  const params = useParams();
  const step = params.step as Step;
  const t = useTranslations("onboard.center");

  const StepComponent = STEP_COMPONENTS[step];

  if (!StepComponent) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">
          {t("invalidStep")}
        </h2>
      </div>
    );
  }

  const currentIndex = STEPS.indexOf(step);
  const prevStep = currentIndex > 0 ? STEPS[currentIndex - 1] : null;
  const basePath = "/onboard/center";

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-white">
        {t(`steps.${step}`)}
      </h2>
      <StepComponent />
      <div className="mt-8 flex justify-between">
        {prevStep ? (
          <Link
            href={`${basePath}/${prevStep}`}
            className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-medium text-white transition-colors hover:bg-white/10"
          >
            {t("back")}
          </Link>
        ) : (
          <div />
        )}
        {/* IMPORTANT: Navigation forward is handled by each step after validation. */}
        <div />
      </div>
    </div>
  );
}
