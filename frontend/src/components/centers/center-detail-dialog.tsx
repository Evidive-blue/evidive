"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { Link } from "@/i18n/navigation";
import { MapPin, ChevronRight, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { MapMarkerData } from "./centers-map";

const CentersMapLazy = dynamic(
  () => import("./centers-map").then((mod) => mod.CentersMap),
  { ssr: false },
);

// ─── Types ───────────────────────────────────────────────

interface CenterDetailDialogProps {
  marker: MapMarkerData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Component ───────────────────────────────────────────

export function CenterDetailDialog({
  marker,
  open,
  onOpenChange,
}: CenterDetailDialogProps): React.ReactNode {
  const t = useTranslations("centers.directory");

  const singleMarker = useMemo<MapMarkerData[]>(
    () => (marker ? [marker] : []),
    [marker],
  );

  if (!marker) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg border-slate-700 bg-slate-900 p-0 sm:max-w-xl"
        showCloseButton={false}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 z-20 rounded-md p-1 text-slate-400 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none"
          aria-label={t("close")}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Mini map */}
        <div className="h-[200px] w-full overflow-hidden rounded-t-lg sm:h-[240px]">
          <CentersMapLazy markers={singleMarker} className="h-full" />
        </div>

        {/* Center info */}
        <div className="px-5 pb-5 pt-2">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-white">
              {marker.name}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="flex items-center gap-1.5 text-sm text-slate-400">
                <MapPin className="h-4 w-4 shrink-0 text-cyan-500/70" />
                <span>
                  {marker.city}, {marker.country}
                </span>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <Link
              href={`/centers/${marker.slug}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none"
            >
              <span>{t("viewCenter")}</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
