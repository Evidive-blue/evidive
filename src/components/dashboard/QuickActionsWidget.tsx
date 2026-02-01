import { Link } from "@/i18n/navigation";
import { Search, CalendarCheck, MessageSquareText, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
}

interface QuickActionsWidgetProps {
  translations: {
    title: string;
    searchDive: string;
    searchDiveDesc: string;
    myBookings: string;
    myBookingsDesc: string;
    myReviews: string;
    myReviewsDesc: string;
  };
}

export function QuickActionsWidget({ translations: t }: QuickActionsWidgetProps) {
  const actions: QuickAction[] = [
    {
      label: t.searchDive,
      description: t.searchDiveDesc,
      href: "/explorer",
      icon: Search,
      iconColor: "text-cyan-400",
      iconBg: "bg-cyan-500/10",
    },
    {
      label: t.myBookings,
      description: t.myBookingsDesc,
      href: "/bookings",
      icon: CalendarCheck,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/10",
    },
    {
      label: t.myReviews,
      description: t.myReviewsDesc,
      href: "/reviews",
      icon: MessageSquareText,
      iconColor: "text-amber-400",
      iconBg: "bg-amber-500/10",
    },
  ];

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="text-white text-base">
          {t.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2">
          {actions.map((action) => (
            <Link key={action.href} href={action.href}>
              <div className="flex items-center gap-3 rounded-xl p-3 transition-all hover:bg-white/5">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.iconBg}`}>
                  <action.icon className={`h-5 w-5 ${action.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {action.label}
                  </p>
                  <p className="text-xs text-white/50 truncate">
                    {action.description}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-white/40" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
