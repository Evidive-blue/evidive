import { getTranslations, setRequestLocale } from "next-intl/server";
import { OnboardStepper } from "@/components/onboard/onboard-stepper";

const STEPS = ["account", "info", "location", "documents", "payments", "review"] as const;

export default async function CenterOnboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "onboard.center" });

  const steps = STEPS.map((step) => ({
    key: step,
    label: t(`steps.${step}`),
  }));

  return (
    <div className="min-h-screen px-4 py-20">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <OnboardStepper steps={steps} basePath="/onboard/center" accentColor="blue" />
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          {children}
        </div>
      </div>
    </div>
  );
}
