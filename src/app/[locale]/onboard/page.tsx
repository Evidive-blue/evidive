import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Waves, Store, Building2 } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "onboard" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function OnboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "onboard" });

  const roles = [
    {
      key: "diver",
      href: "/onboard/diver",
      icon: Waves,
      gradient: "from-cyan-500/30 to-blue-500/30",
      accent: "cyan",
      hoverBorder: "hover:border-cyan-500/50",
      glow: "bg-cyan-500/10 group-hover:bg-cyan-500/20",
    },
    {
      key: "seller",
      href: "/onboard/seller",
      icon: Store,
      gradient: "from-emerald-500/30 to-teal-500/30",
      accent: "emerald",
      hoverBorder: "hover:border-emerald-500/50",
      glow: "bg-emerald-500/10 group-hover:bg-emerald-500/20",
    },
    {
      key: "center",
      href: "/onboard/center",
      icon: Building2,
      gradient: "from-blue-500/30 to-indigo-500/30",
      accent: "blue",
      hoverBorder: "hover:border-blue-500/50",
      glow: "bg-blue-500/10 group-hover:bg-blue-500/20",
    },
  ] as const;

  const accentColors = {
    cyan: "bg-cyan-500",
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
  };

  const iconColors = {
    cyan: "text-cyan-400",
    emerald: "text-emerald-400",
    blue: "text-blue-400",
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-20">
      <div className="w-full max-w-6xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
            {t("title")}
          </h1>
          <p className="text-lg text-white/70">{t("subtitle")}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Link
                key={role.key}
                href={role.href}
                className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all ${role.hoverBorder} hover:bg-white/10`}
              >
                <div
                  className={`absolute -right-8 -top-8 h-32 w-32 rounded-full ${role.glow} blur-3xl transition-all`}
                />
                <div className="relative">
                  <div
                    className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${role.gradient}`}
                  >
                    <Icon className={`h-8 w-8 ${iconColors[role.accent]}`} />
                  </div>
                  <h2 className="mb-3 text-2xl font-bold text-white">
                    {t(`${role.key}.title`)}
                  </h2>
                  <p className="text-white/60">{t(`${role.key}.description`)}</p>
                  <ul className="mt-6 space-y-2">
                    {["feature1", "feature2", "feature3"].map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm text-white/50"
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${accentColors[role.accent]}`}
                        />
                        {t(`${role.key}.${feature}`)}
                      </li>
                    ))}
                  </ul>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
