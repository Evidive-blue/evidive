type StatusBadgeProps = {
  status: string;
  label?: string;
};

// Map of status to tailwind classes
const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  confirmed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  suspended: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
  expired: "bg-red-500/10 text-red-400 border-red-500/20",
  blocked: "bg-red-500/10 text-red-400 border-red-500/20",
  inactive: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  draft: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  booking: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  holiday: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  percentage: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  fixed: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {label ?? status}
    </span>
  );
}
