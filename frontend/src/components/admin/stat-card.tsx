import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string;
  description?: string;
  icon?: LucideIcon;
  trend?: { value: number; label?: string }; // positive = up, negative = down
  className?: string;
};

export function StatCard({ title, value, description, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div className={cn(
      "rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition-colors hover:border-slate-700",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        {Icon && (
          <div className="rounded-lg bg-cyan-500/10 p-2.5">
            <Icon className="h-5 w-5 text-cyan-400" />
          </div>
        )}
      </div>
      {(description || trend) && (
        <div className="mt-3 flex items-center gap-2">
          {trend && (
            <span className={cn(
              "inline-flex items-center text-xs font-medium",
              trend.value >= 0 ? "text-emerald-400" : "text-red-400"
            )}>
              {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
              {trend.label && <span className="ml-1 text-slate-500">{trend.label}</span>}
            </span>
          )}
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
      )}
    </div>
  );
}
