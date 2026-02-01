import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CenterRegistrationWizard } from "@/components/auth/center";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "centerRegistration.meta" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function RegisterCenterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "centerRegistration" });

  return (
    <div className="relative min-h-screen overflow-hidden pb-16 pt-24">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute right-1/4 top-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-[128px]" />
        <div className="absolute bottom-1/4 left-1/4 h-96 w-96 rounded-full bg-blue-900/20 blur-[128px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-3xl font-bold text-white sm:text-4xl">
            {t("title")}
          </h1>
          <p className="text-white/60">{t("subtitle")}</p>
          <p className="mt-4 text-sm text-white/40">
            {t("alreadyAccount")}{" "}
            <Link
              href="/login"
              className="text-cyan-400 transition-colors hover:text-cyan-300"
            >
              {t("loginLink")}
            </Link>
          </p>
        </div>

        {/* Wizard */}
        <CenterRegistrationWizard />
      </div>
    </div>
  );
}
