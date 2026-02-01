import { getTranslations, setRequestLocale } from "next-intl/server";
import { OnboardStepper } from "@/components/onboard/onboard-stepper";

const DIVER_STEPS = ["account", "preferences", "review"] as const;

export default async function DiverOnboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "onboard.diver" });

  const steps = DIVER_STEPS.map((step) => ({
    key: step,
    label: t(`steps.${step}`),
  }));

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-20">
      <div className="w-full max-w-2xl">
        <OnboardStepper steps={steps} basePath="/onboard/diver" accentColor="cyan" />
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
