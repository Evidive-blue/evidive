import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { getUserSettings } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { SettingsForm } from "@/components/settings";

interface SettingsPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: SettingsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "settings" });

  return {
    title: `${t("title")} - EviDive`,
    description: t("subtitle"),
  };
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("settings");
  const session = await auth();

  // Redirect if not authenticated
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  // Fetch user settings
  const settings = await getUserSettings();

  if (!settings) {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/app">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              {t("backToDashboard")}
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t("title")}</h1>
          <p className="text-white/70">{t("subtitle")}</p>
        </div>

        {/* Settings Form (Client Component) */}
        <SettingsForm locale={locale} settings={settings} />
      </div>
    </div>
  );
}
