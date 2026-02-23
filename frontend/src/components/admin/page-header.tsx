"use client";

import { useTranslations } from "next-intl";

type PageHeaderProps = {
  titleKey: string;
  descriptionKey?: string;
  namespace?: string; // default "admin"
  children?: React.ReactNode; // action buttons slot
};

export function PageHeader({ titleKey, descriptionKey, namespace = "admin", children }: PageHeaderProps) {
  const t = useTranslations(namespace);
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{t(titleKey)}</h1>
        {descriptionKey && (
          <p className="mt-1 text-sm text-slate-400">{t(descriptionKey)}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
