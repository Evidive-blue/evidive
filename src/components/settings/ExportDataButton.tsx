"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Download, Loader2, CheckCircle } from "lucide-react";
import { exportUserData } from "@/actions/settings";

interface ExportDataButtonProps {
  onError?: (error: string) => void;
}

export function ExportDataButton({ onError }: ExportDataButtonProps) {
  const t = useTranslations("settings");
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);

  const handleExport = () => {
    setIsSuccess(false);
    startTransition(async () => {
      const result = await exportUserData();
      if (result.ok && result.data) {
        // Create and download JSON file
        const blob = new Blob([JSON.stringify(result.data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `evidive-data-export-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 3000);
      } else {
        onError?.(result.error || "unknown_error");
      }
    });
  };

  return (
    <button
      onClick={handleExport}
      disabled={isPending}
      className="flex w-full items-center justify-between rounded-xl border border-white/20 p-4 text-left transition-all hover:border-cyan-500/50 hover:bg-cyan-500/5 disabled:opacity-50 disabled:cursor-not-allowed"
      type="button"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">
          {isPending ? (
            <Loader2 className="h-5 w-5 text-cyan-400 animate-spin" />
          ) : isSuccess ? (
            <CheckCircle className="h-5 w-5 text-emerald-400" />
          ) : (
            <Download className="h-5 w-5 text-cyan-400" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-white">
            {t("account.export.label")}
          </p>
          <p className="text-xs text-white/60">
            {isSuccess
              ? t("account.export.success")
              : t("account.export.description")}
          </p>
        </div>
      </div>
    </button>
  );
}
