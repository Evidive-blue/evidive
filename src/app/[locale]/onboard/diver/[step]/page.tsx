import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { DiverAccountStep } from "@/components/onboard/diver/account-step";
import { DiverPreferencesStep } from "@/components/onboard/diver/preferences-step";
import { DiverReviewStep } from "@/components/onboard/diver/review-step";

const VALID_STEPS = ["account", "preferences", "review"] as const;
type Step = (typeof VALID_STEPS)[number];

const STEP_COMPONENTS: Record<Step, React.ComponentType> = {
  account: DiverAccountStep,
  preferences: DiverPreferencesStep,
  review: DiverReviewStep,
};

export async function generateStaticParams() {
  return VALID_STEPS.map((step) => ({ step }));
}

export default async function DiverStepPage({
  params,
}: {
  params: Promise<{ locale: string; step: string }>;
}) {
  const { locale, step } = await params;
  setRequestLocale(locale);

  if (!VALID_STEPS.includes(step as Step)) {
    notFound();
  }

  const StepComponent = STEP_COMPONENTS[step as Step];

  return <StepComponent />;
}
