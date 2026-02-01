import { getTranslations, setRequestLocale } from "next-intl/server";
import { OnboardStepper } from "@/components/onboard/onboard-stepper";

const SELLER_STEPS = ["account", "profile", "services", "payments", "review"] as const;

export default async function SellerOnboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "onboard.seller" });

  const steps = SELLER_STEPS.map((step) => ({
    key: step,
    label: t(`steps.${step}`),
  }));

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-20">
      <div className="w-full max-w-2xl">
        <OnboardStepper steps={steps} basePath="/onboard/seller" accentColor="emerald" />
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
