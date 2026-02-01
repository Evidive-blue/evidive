import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface QuickStatsCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color?: string;
  bgColor?: string;
}

export function QuickStatsCard({
  label,
  value,
  icon: Icon,
  color = "text-cyan-400",
  bgColor = "bg-cyan-500/10",
}: QuickStatsCardProps) {
  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              bgColor
            )}
          >
            <Icon className={cn("h-5 w-5", color)} />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-white/60">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
