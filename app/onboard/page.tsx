import type { Metadata } from "next";
import Link from "next/link";
import { Waves, Building2 } from "lucide-react";
import { getLocale } from "@/lib/i18n/get-locale-server";
import { getMessages, getNestedValue } from "@/lib/i18n/get-messages";
import { getTranslationsServer } from "@/lib/i18n/get-translations-server";

function requireString(messages: Record<string, unknown>, path: string): string {
  const value = getNestedValue(messages, path);
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing i18n string: ${path}`);
  }
  return value;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  return {
    title: requireString(messages, "metadata.onboard.title"),
    description: requireString(messages, "metadata.onboard.description"),
  };
}

export default async function OnboardPage() {
  const { t } = await getTranslationsServer("onboardWelcome");
  const options = [
    {
      key: "diver",
      href: "/onboard/diver",
      icon: Waves,
      features: [
        t("diver.features.discover"),
        t("diver.features.book"),
        t("diver.features.track"),
      ],
      gradient: "from-cyan-500/30 to-blue-500/30",
      iconColor: "text-cyan-400",
      hoverBorder: "hover:border-cyan-500/50",
      glow: "bg-cyan-500/10 group-hover:bg-cyan-500/20",
      accentColor: "bg-cyan-500",
    },
    {
      key: "center",
      href: "/onboard/center",
      icon: Building2,
      features: [
        t("center.features.reach"),
        t("center.features.manage"),
        t("center.features.grow"),
      ],
      gradient: "from-blue-500/30 to-indigo-500/30",
      iconColor: "text-blue-400",
      hoverBorder: "hover:border-blue-500/50",
      glow: "bg-blue-500/10 group-hover:bg-blue-500/20",
      accentColor: "bg-blue-500",
    },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-20">
      <div className="w-full max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">
            {t("title")}
          </h1>
          <p className="text-lg text-white/70">
            {t("question")}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <Link
                key={option.key}
                href={option.href}
                className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition-all ${option.hoverBorder} hover:bg-white/10`}
              >
                <div
                  className={`absolute -right-8 -top-8 h-32 w-32 rounded-full ${option.glow} blur-3xl transition-all`}
                />
                <div className="relative">
                  <div
                    className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${option.gradient}`}
                  >
                    <Icon className={`h-8 w-8 ${option.iconColor}`} />
                  </div>
                  <h2 className="mb-3 text-2xl font-bold text-white">
                    {t(`${option.key}.title`)}
                  </h2>
                  <p className="text-white/60">{t(`${option.key}.description`)}</p>
                  <ul className="mt-6 space-y-2">
                    {option.features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-sm text-white/50"
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${option.accentColor}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </Link>
            );
          })}
        </div>

        <p className="mt-8 text-center text-sm text-white/40">
          {t("laterNote")}
        </p>
      </div>
    </div>
  );
}
