import { cn } from "@/lib/utils";
import type { BookingStatus } from "@prisma/client";

interface BookingStatusBadgeProps {
  status: BookingStatus;
  translations: {
    PENDING: string;
    CONFIRMED: string;
    PAID: string;
    RUNNING: string;
    COMPLETED: string;
    CANCELLED: string;
    NOSHOW: string;
    REMOVED: string;
  };
  className?: string;
}

const statusConfig: Record<
  BookingStatus,
  { bgColor: string; textColor: string; dotColor: string }
> = {
  PENDING: {
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-400",
    dotColor: "bg-amber-400",
  },
  CONFIRMED: {
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-400",
    dotColor: "bg-blue-400",
  },
  PAID: {
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-400",
    dotColor: "bg-emerald-400",
  },
  RUNNING: {
    bgColor: "bg-cyan-500/10",
    textColor: "text-cyan-400",
    dotColor: "bg-cyan-400",
  },
  COMPLETED: {
    bgColor: "bg-gray-500/10",
    textColor: "text-gray-400",
    dotColor: "bg-gray-400",
  },
  CANCELLED: {
    bgColor: "bg-red-500/10",
    textColor: "text-red-400",
    dotColor: "bg-red-400",
  },
  NOSHOW: {
    bgColor: "bg-orange-500/10",
    textColor: "text-orange-400",
    dotColor: "bg-orange-400",
  },
  REMOVED: {
    bgColor: "bg-zinc-500/10",
    textColor: "text-zinc-400",
    dotColor: "bg-zinc-400",
  },
};

export function BookingStatusBadge({
  status,
  translations,
  className,
}: BookingStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        config.bgColor,
        config.textColor,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dotColor)} />
      {translations[status]}
    </span>
  );
}
