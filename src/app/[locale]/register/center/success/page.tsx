import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CheckCircle2, Mail, Clock, ArrowRight } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "centerRegistration.success.meta" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function RegisterCenterSuccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "centerRegistration.success" });

  return (
    <div className="relative min-h-screen overflow-hidden pb-16 pt-24">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute right-1/4 top-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-[128px]" />
        <div className="absolute bottom-1/4 left-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-[128px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl sm:p-12">
          {/* Success Icon */}
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 ring-4 ring-emerald-500/10">
            <CheckCircle2 className="h-12 w-12 text-emerald-400" />
          </div>

          {/* Title */}
          <h1 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mb-8 text-lg text-white/70">{t("subtitle")}</p>

          {/* Info Cards */}
          <div className="mb-10 space-y-4">
            <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-4 text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20">
                <Mail className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{t("emailSent.title")}</h3>
                <p className="text-sm text-white/60">{t("emailSent.description")}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-4 text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/20">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{t("review.title")}</h3>
                <p className="text-sm text-white/60">{t("review.description")}</p>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div className="mb-10 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-left">
            <h3 className="mb-3 font-semibold text-emerald-300">{t("whatsNext.title")}</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                {t("whatsNext.step1")}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                {t("whatsNext.step2")}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                {t("whatsNext.step3")}
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/dashboard/center"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-8 py-4 font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t("dashboardButton")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-8 py-4 font-semibold text-white/90 transition-colors hover:bg-white/10"
            >
              {t("homeButton")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
