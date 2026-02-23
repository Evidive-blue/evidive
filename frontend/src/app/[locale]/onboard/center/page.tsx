import { getTranslations } from "next-intl/server";
import { OnboardCenterClient } from "./onboard-center-client";

export async function generateMetadata() {
  const t = await getTranslations("onboard");
  return { title: t("title") };
}

export default async function OnboardCenterPage() {
  const t = await getTranslations("onboard");
  return (
    <main className="min-h-[calc(100svh-6rem)] bg-slate-950 px-4 pb-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-xl font-bold text-white md:text-2xl lg:text-3xl">{t("title")}</h1>
        <p className="mb-8 text-slate-400">{t("subtitle")}</p>
        <OnboardCenterClient />
      </div>
    </main>
  );
}
