import { getTranslations } from "next-intl/server";
import { AdminSettingsClient } from "@/components/admin/admin-settings-client";

export default async function AdminSettingsPage() {
  const t = await getTranslations("admin");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">{t("settings")}</h2>
      <AdminSettingsClient />
    </div>
  );
}
