import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { SellerAccountStep } from "@/components/onboard/seller/account-step";
import { SellerProfileStep } from "@/components/onboard/seller/profile-step";
import { SellerServicesStep } from "@/components/onboard/seller/services-step";
import { SellerPaymentsStep } from "@/components/onboard/seller/payments-step";
import { SellerReviewStep } from "@/components/onboard/seller/review-step";

const VALID_STEPS = ["account", "profile", "services", "payments", "review"] as const;
type Step = (typeof VALID_STEPS)[number];

const STEP_COMPONENTS: Record<Step, React.ComponentType> = {
  account: SellerAccountStep,
  profile: SellerProfileStep,
  services: SellerServicesStep,
  payments: SellerPaymentsStep,
  review: SellerReviewStep,
};

export async function generateStaticParams() {
  return VALID_STEPS.map((step) => ({ step }));
}

export default async function SellerStepPage({
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
