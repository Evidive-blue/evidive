"use client";

import { useState, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  CalendarDays,
  Users,
  CreditCard,
  Star,
  Settings,
  ArrowLeft,
  BookOpen,
  Clock,
  Palmtree,
  Percent,
  DollarSign,
  ChevronDown,
  UserPlus,
  Building2,
  Plus,
  Wrench,
} from "lucide-react";
import { CreateCenterDialog } from "@/components/dashboard/create-center-dialog";

type NavItem = {
  href: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

type NavSection = {
  titleKey?: string;
  items: NavItem[];
  collapsible?: boolean;
};

const navSections: NavSection[] = [
  {
    items: [
      {
        href: "/dashboard",
        labelKey: "overview",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    titleKey: "sectionBookings",
    collapsible: true,
    items: [
      { href: "/dashboard/bookings", labelKey: "bookings", icon: BookOpen },
      { href: "/dashboard/calendar", labelKey: "calendar", icon: CalendarDays },
    ],
  },
  {
    titleKey: "sectionPlanning",
    collapsible: true,
    items: [
      { href: "/dashboard/services", labelKey: "services", icon: Briefcase },
      {
        href: "/dashboard/working-hours",
        labelKey: "workingHours",
        icon: Clock,
      },
      { href: "/dashboard/holidays", labelKey: "holidays", icon: Palmtree },
    ],
  },
  {
    titleKey: "sectionTeamFinances",
    collapsible: true,
    items: [
      { href: "/dashboard/team", labelKey: "team", icon: Users },
      { href: "/dashboard/members", labelKey: "members", icon: UserPlus },
      { href: "/dashboard/payments", labelKey: "payments", icon: CreditCard },
      { href: "/dashboard/revenue", labelKey: "revenue", icon: DollarSign },
      {
        href: "/dashboard/commissions",
        labelKey: "commissions",
        icon: Percent,
      },
    ],
  },
  {
    titleKey: "sectionOther",
    items: [
      { href: "/dashboard/reviews", labelKey: "reviews", icon: Star },
      { href: "/dashboard/settings", labelKey: "settings", icon: Settings },
    ],
  },
];

export function DashboardSidebar(): React.JSX.Element {
  const pathname = usePathname();
  const t = useTranslations("dashboard");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [createCenterOpen, setCreateCenterOpen] = useState(false);

  const toggleSection = useCallback((key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <>
      <aside className="flex h-full w-full flex-col bg-transparent">
        {/* Back to site */}
        <div className="border-b border-white/[0.06] px-5 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToSite")}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
          {/* ── Centre management section ── */}
          <div className="mb-3 rounded-lg border border-cyan-500/10 bg-cyan-500/5 p-3">
            <div className="mb-2 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-cyan-400" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
                {t("sectionCenter")}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => setCreateCenterOpen(true)}
                className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-slate-300 transition-colors hover:bg-cyan-500/10 hover:text-cyan-300"
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span className="truncate">{t("newCenter")}</span>
              </button>
              <Link
                href="/dashboard/settings"
                className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                  pathname.includes("/dashboard/settings")
                    ? "bg-cyan-500/10 text-cyan-400"
                    : "text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-300"
                )}
              >
                <Wrench className="h-4 w-4 shrink-0" />
                <span className="truncate">{t("configureCenter")}</span>
              </Link>
            </div>
          </div>

          {/* ── Existing nav sections ── */}
          {navSections.map((section, idx) => {
            const sectionKey = section.titleKey ?? `section-${idx}`;
            const isCollapsed =
              section.collapsible === true && collapsed[sectionKey] === true;

            return (
              <div key={sectionKey} className={cn(idx > 0 && "mt-2")}>
                {/* Section title */}
                {section.titleKey && (
                  <button
                    type="button"
                    onClick={
                      section.collapsible
                        ? () => toggleSection(sectionKey)
                        : undefined
                    }
                    className={cn(
                      "mb-1 flex w-full items-center justify-between rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider",
                      section.collapsible
                        ? "cursor-pointer text-slate-500 hover:bg-white/[0.06] hover:text-slate-300"
                        : "cursor-default text-slate-500"
                    )}
                  >
                    <span>{t(section.titleKey)}</span>
                    {section.collapsible && (
                      <ChevronDown
                        className={cn(
                          "h-3 w-3 transition-transform duration-200",
                          isCollapsed && "-rotate-90"
                        )}
                      />
                    )}
                  </button>
                )}

                {/* Section items */}
                {!isCollapsed && (
                  <div className="flex flex-col gap-0.5">
                    {section.items.map((item) => {
                      const isActive = item.exact
                        ? pathname.endsWith("/dashboard")
                        : pathname.includes(item.href);
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                            isActive
                              ? "bg-cyan-500/10 text-cyan-400"
                              : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{t(item.labelKey)}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Center creation modal */}
      <CreateCenterDialog
        open={createCenterOpen}
        onOpenChange={setCreateCenterOpen}
      />
    </>
  );
}
