"use client";

import { useEffect, useState, useCallback } from "react";
import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { adminApi, type AdminStats } from "@/lib/api";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  MapPin,
  Briefcase,
  CreditCard,
  Percent,
  Star,
  Bell,
  Settings,
  BarChart3,
  Store,
  CalendarDays,
  RotateCcw,
  Tag,
  FolderTree,
  ArrowLeft,
  Map,
  Ticket,
  PackagePlus,
  ChevronDown,
} from "lucide-react";

type NavItem = {
  href: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  badgeKey?: keyof BadgeCounts;
};

type NavSection = {
  title?: string;
  items: NavItem[];
  collapsible?: boolean;
};

type BadgeCounts = {
  pendingBookings: number;
  pendingCenters: number;
  pendingReviews: number;
};

const navSections: NavSection[] = [
  {
    items: [
      { href: "/admin", labelKey: "dashboard", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    title: "navBookingSection",
    collapsible: true,
    items: [
      { href: "/admin/bookings", labelKey: "bookings", icon: BookOpen, badgeKey: "pendingBookings" },
      { href: "/admin/plannings", labelKey: "plannings", icon: CalendarDays },
      { href: "/admin/payments", labelKey: "paymentsHistory", icon: CreditCard },
    ],
  },
  {
    title: "navMarketplaceSection",
    collapsible: true,
    items: [
      { href: "/admin/vendors", labelKey: "vendors", icon: Store },
      { href: "/admin/coupons", labelKey: "coupons", icon: Ticket },
      { href: "/admin/commissions", labelKey: "commissions", icon: Percent },
      { href: "/admin/refunds", labelKey: "refunds", icon: RotateCcw },
    ],
  },
  {
    title: "navCentersSection",
    collapsible: true,
    items: [
      { href: "/admin/centers", labelKey: "centers", icon: MapPin, badgeKey: "pendingCenters" },
      { href: "/admin/locations", labelKey: "locations", icon: Map },
      { href: "/admin/categories", labelKey: "categories", icon: FolderTree },
      { href: "/admin/tags", labelKey: "tags", icon: Tag },
      { href: "/admin/services", labelKey: "services", icon: Briefcase },
      { href: "/admin/extras", labelKey: "extras", icon: PackagePlus },
    ],
  },
  {
    title: "navContentSection",
    collapsible: true,
    items: [
      { href: "/admin/reviews", labelKey: "reviews", icon: Star, badgeKey: "pendingReviews" },
      { href: "/admin/notifications", labelKey: "notifications", icon: Bell },
      { href: "/admin/reports", labelKey: "reports", icon: BarChart3 },
    ],
  },
  {
    title: "navSettingsSection",
    items: [
      { href: "/admin/users", labelKey: "usersManagement", icon: Users },
      { href: "/admin/settings", labelKey: "settings", icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const t = useTranslations("admin");
  const [badges, setBadges] = useState<BadgeCounts>({
    pendingBookings: 0,
    pendingCenters: 0,
    pendingReviews: 0,
  });
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Load badge counts
  useEffect(() => {
    adminApi
      .getStats()
      .then((stats: AdminStats) => {
        setBadges({
          pendingBookings: stats.total_bookings ?? 0,
          pendingCenters: stats.pending_centers ?? 0,
          pendingReviews: stats.total_reviews ?? 0,
        });
      })
      .catch(() => {
        // Silently fail - badges are non-critical
      });
  }, []);

  const toggleSection = useCallback((title: string) => {
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));
  }, []);

  return (
    <aside className="flex h-full w-full flex-col bg-transparent">
      <div className="border-b border-white/[0.06] p-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToSite")}
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
        {navSections.map((section, idx) => {
          const sectionKey = section.title ?? `section-${idx}`;
          const isCollapsed = section.collapsible && collapsed[sectionKey];
          const hasActiveBadge = section.items.some(
            (item) => item.badgeKey && badges[item.badgeKey] > 0
          );

          return (
            <div key={sectionKey}>
              {section.title && (
                <button
                  type="button"
                  onClick={
                    section.collapsible
                      ? () => toggleSection(sectionKey)
                      : undefined
                  }
                  className={cn(
                    "mb-1 mt-4 flex w-full items-center justify-between px-3 text-xs font-semibold uppercase tracking-wider",
                    section.collapsible
                      ? "cursor-pointer text-slate-500 hover:text-slate-300"
                      : "cursor-default text-slate-500"
                  )}
                >
                  <span className="flex items-center gap-2">
                    {t(section.title)}
                    {isCollapsed && hasActiveBadge && (
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    )}
                  </span>
                  {section.collapsible && (
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 transition-transform",
                        isCollapsed && "-rotate-90"
                      )}
                    />
                  )}
                </button>
              )}
              {!isCollapsed &&
                section.items.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href || pathname.endsWith("/admin")
                    : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  const badgeCount = item.badgeKey
                    ? badges[item.badgeKey]
                    : 0;

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
                      <span className="flex-1">{t(item.labelKey)}</span>
                      {badgeCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-500/20 px-1.5 text-[10px] font-bold text-cyan-400">
                          {badgeCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
