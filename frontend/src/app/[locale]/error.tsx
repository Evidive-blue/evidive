"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <AlertTriangle className="mb-6 h-16 w-16 text-amber-400" aria-hidden="true" />
      <h1 className="mb-4 text-xl font-bold text-white md:text-2xl lg:text-3xl">
        {t("errorTitle")}
      </h1>
      <p className="mb-2 max-w-md text-lg text-slate-400">
        {t("errorDescription")}
      </p>
      {error.digest && (
        <p className="mb-6 text-xs text-slate-600">
          Ref: {error.digest}
        </p>
      )}
      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center rounded-xl bg-cyan-600 px-6 py-3 font-medium text-white transition-colors hover:bg-cyan-500"
      >
        {t("tryAgain")}
      </button>
    </div>
  );
}
