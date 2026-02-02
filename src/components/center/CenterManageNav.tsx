"use client";

import { useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface Center {
  id: string;
  slug: string;
  name: string;
  status: string;
}

interface CurrentCenter extends Center {
  verified: boolean;
}

interface CenterManageNavProps {
  currentCenter: CurrentCenter;
  centers: Center[];
  locale: string;
}

export function CenterManageNav({
  currentCenter,
  centers,
  locale,
}: CenterManageNavProps) {
  const t = useTranslations("centerManage");
  const pathname = usePathname();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const navItems = [
    { key: "dashboard", href: `/center/manage/${currentCenter.slug}`, label: t("nav.dashboard"), icon: "📊" },
    { key: "bookings", href: `/center/manage/${currentCenter.slug}/bookings`, label: t("nav.bookings"), icon: "📅" },
    { key: "services", href: `/center/manage/${currentCenter.slug}/services`, label: t("nav.services"), icon: "🤿" },
    { key: "calendar", href: `/center/manage/${currentCenter.slug}/calendar`, label: t("nav.calendar"), icon: "📆" },
    { key: "reviews", href: `/center/manage/${currentCenter.slug}/reviews`, label: t("nav.reviews"), icon: "⭐" },
    { key: "team", href: `/center/manage/${currentCenter.slug}/team`, label: t("nav.team"), icon: "👥" },
    { key: "stats", href: `/center/manage/${currentCenter.slug}/stats`, label: t("nav.stats"), icon: "📈" },
    { key: "profile", href: `/center/manage/${currentCenter.slug}/profile`, label: t("nav.profile"), icon: "🏢" },
    { key: "settings", href: `/center/manage/${currentCenter.slug}/settings`, label: t("nav.settings"), icon: "⚙️" },
  ];

  const handleCenterSwitch = (slug: string) => {
    // Navigate to the same page but for a different center
    const newPath = pathname.replace(
      `/center/manage/${currentCenter.slug}`,
      `/center/manage/${slug}`
    );
    router.push(newPath);
    setIsDropdownOpen(false);
  };

  const isActive = (href: string) => {
    if (href === `/center/manage/${currentCenter.slug}`) {
      return pathname === href || pathname === `/${locale}${href}`;
    }
    return pathname.startsWith(href) || pathname.startsWith(`/${locale}${href}`);
  };

  return (
    <div className="sticky top-16 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Center Selector */}
        <div className="flex items-center justify-between py-4 border-b border-white/5">
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2 transition hover:bg-white/10"
            >
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">
                    {currentCenter.name}
                  </span>
                  {currentCenter.verified && (
                    <span className="text-cyan-400" title={t("verified")}>
                      ✓
                    </span>
                  )}
                </div>
                {currentCenter.status !== "APPROVED" && (
                  <span className="text-xs text-amber-400">
                    {t(`status.${currentCenter.status.toLowerCase()}`)}
                  </span>
                )}
              </div>
              {centers.length > 1 && (
                <svg
                  className={`h-4 w-4 text-white/60 transition-transform ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              )}
            </button>

            {/* Dropdown */}
            {isDropdownOpen && centers.length > 1 && (
              <div className="absolute left-0 top-full mt-2 w-64 rounded-xl border border-white/10 bg-slate-900 p-2 shadow-xl">
                {centers.map((center) => (
                  <button
                    key={center.id}
                    onClick={() => handleCenterSwitch(center.slug)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition ${
                      center.slug === currentCenter.slug
                        ? "bg-cyan-500/20 text-cyan-200"
                        : "text-white/80 hover:bg-white/10"
                    }`}
                  >
                    <span className="truncate">{center.name}</span>
                    {center.status !== "APPROVED" && (
                      <span className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300">
                        {t(`status.${center.status.toLowerCase()}`)}
                      </span>
                    )}
                  </button>
                ))}
                <div className="mt-2 border-t border-white/10 pt-2">
                  <Link
                    href="/onboard/center"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-white/60 transition hover:bg-white/10 hover:text-white"
                  >
                    <span>+</span>
                    <span>{t("addCenter")}</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/dashboard"
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            ← {t("backToDashboard")}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive(item.href)
                  ? "bg-cyan-500/20 text-cyan-200"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
