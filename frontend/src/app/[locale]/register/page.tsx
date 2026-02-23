import { getTranslations } from "next-intl/server";
import { RegisterClient } from "./register-client";

export async function generateMetadata() {
  const t = await getTranslations("register");
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default async function RegisterPage() {
  const t = await getTranslations("register");

  return (
    <section className="relative z-10 -mt-[calc(35vh+1rem)] flex min-h-svh items-center justify-center px-4 pb-20 pt-20 md:-mt-20 md:pb-8">
      <div className="w-full max-w-md">
        <div className="glass-ocean-solid rounded-2xl p-6 shadow-2xl shadow-black/50 ring-1 ring-white/10 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-white">{t("title")}</h1>
            <p className="mt-1 text-sm text-slate-400">{t("subtitle")}</p>
          </div>
          <RegisterClient />
        </div>
      </div>
    </section>
  );
}
