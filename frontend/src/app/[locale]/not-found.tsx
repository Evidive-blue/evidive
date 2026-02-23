import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("common");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <span className="mb-6 text-8xl" aria-hidden="true">
        🤿
      </span>
      <h1 className="mb-4 text-2xl font-bold text-white md:text-3xl lg:text-4xl">404</h1>
      <p className="mb-8 max-w-md text-lg text-slate-400">
        {t("notFoundDescription")}
      </p>
      <Link
        href="/"
        className="inline-flex items-center rounded-xl bg-cyan-600 px-6 py-3 font-medium text-white transition-colors hover:bg-cyan-500"
      >
        {t("backToHome")}
      </Link>
    </div>
  );
}
