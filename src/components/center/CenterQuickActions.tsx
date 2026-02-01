"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { Plus, Calendar, ClipboardList, Settings, ChevronRight, Users, BarChart3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
}

interface CenterQuickActionsProps {
  translations: {
    title: string;
    createOffer: string;
    createOfferDesc: string;
    viewCalendar: string;
    viewCalendarDesc: string;
    manageBookings: string;
    manageBookingsDesc: string;
    viewStats: string;
    viewStatsDesc: string;
    manageTeam: string;
    manageTeamDesc: string;
    editCenter: string;
    editCenterDesc: string;
  };
}

export function CenterQuickActions({ translations: t }: CenterQuickActionsProps) {
  const actions: QuickAction[] = [
    {
      label: t.createOffer,
      description: t.createOfferDesc,
      href: "/center/services/new",
      icon: Plus,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/10",
    },
    {
      label: t.viewCalendar,
      description: t.viewCalendarDesc,
      href: "/center/calendar",
      icon: Calendar,
      iconColor: "text-cyan-400",
      iconBg: "bg-cyan-500/10",
    },
    {
      label: t.manageBookings,
      description: t.manageBookingsDesc,
      href: "/center/bookings",
      icon: ClipboardList,
      iconColor: "text-amber-400",
      iconBg: "bg-amber-500/10",
    },
    {
      label: t.viewStats,
      description: t.viewStatsDesc,
      href: "/center/stats",
      icon: BarChart3,
      iconColor: "text-pink-400",
      iconBg: "bg-pink-500/10",
    },
    {
      label: t.manageTeam,
      description: t.manageTeamDesc,
      href: "/center/team",
      icon: Users,
      iconColor: "text-blue-400",
      iconBg: "bg-blue-500/10",
    },
    {
      label: t.editCenter,
      description: t.editCenterDesc,
      href: "/center/profile",
      icon: Settings,
      iconColor: "text-purple-400",
      iconBg: "bg-purple-500/10",
    },
  ];

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="text-lg text-white">{t.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2">
          {actions.map((action) => (
            <Link key={action.href} href={action.href}>
              <div className="flex items-center gap-3 rounded-xl p-3 transition-all hover:bg-white/5">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${action.iconBg}`}
                >
                  <action.icon className={`h-5 w-5 ${action.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {action.label}
                  </p>
                  <p className="truncate text-xs text-white/50">
                    {action.description}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-white/40" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
