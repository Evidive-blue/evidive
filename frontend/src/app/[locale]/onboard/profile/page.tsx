import { useTranslations } from "next-intl";
import { OnboardProfileClient } from "@/components/onboard/onboard-profile-client";

export default function OnboardProfilePage(): React.JSX.Element {
  const t = useTranslations("onboard");
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-8 md:py-16">
      <div className="glass-ocean-solid w-full max-w-lg rounded-2xl p-6 shadow-2xl shadow-black/40 sm:p-8">
        <h1 className="text-xl font-bold text-white md:text-2xl">{t("profileTitle")}</h1>
        <p className="mt-1 text-sm text-slate-400">{t("profileSubtitle")}</p>
        <div className="mt-6">
          <OnboardProfileClient />
        </div>
      </div>
    </main>
  );
}
