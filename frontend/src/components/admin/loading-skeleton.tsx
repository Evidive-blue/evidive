import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48 bg-slate-800" />
        <Skeleton className="h-9 w-32 bg-slate-800" />
      </div>
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Skeleton key={`stat-${String(idx)}`} className="h-24 rounded-xl bg-slate-800" />
        ))}
      </div>
      {/* Table */}
      <Skeleton className="h-64 rounded-xl bg-slate-800" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800">
      <div className="border-b border-slate-800 bg-slate-900/80 px-6 py-4">
        <div className="flex gap-8">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton key={`head-${String(colIdx)}`} className="h-4 w-20 bg-slate-700" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={`row-${String(rowIdx)}`} className="flex gap-8 border-b border-slate-800 px-6 py-4">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton key={`cell-${String(colIdx)}`} className="h-4 w-20 bg-slate-800" />
          ))}
        </div>
      ))}
    </div>
  );
}
