"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { unblockDateAction } from "@/app/[locale]/center/calendar/actions";
import { cn } from "@/lib/utils";
import { Ban, Calendar, Clock, Trash2, Loader2, AlertCircle } from "lucide-react";

interface BlockedDateData {
  id: string;
  blockedDate: string;
  reason: string | null;
  allDay: boolean;
  blockedTimes: string[];
}

interface BlockedDatesListProps {
  blockedDates: BlockedDateData[];
  centerId: string;
  locale: string;
  translations: {
    title: string;
    empty: string;
    allDay: string;
    specificTimes: string;
    noReason: string;
    delete: string;
    confirmDelete: string;
  };
}

export function BlockedDatesList({
  blockedDates,
  centerId,
  locale,
  translations: t,
}: BlockedDatesListProps) {
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const formData = new FormData();
    formData.set("id", id);
    formData.set("centerId", centerId);

    const result = await unblockDateAction(formData);
    setDeletingId(null);
    setConfirmDeleteId(null);

    if (!result.success) {
      console.error("Failed to unblock date:", result.error);
    }
  };

  // Sort by date (closest first)
  const sortedDates = [...blockedDates].sort(
    (a, b) => new Date(a.blockedDate).getTime() - new Date(b.blockedDate).getTime()
  );

  // Filter to show only future or today's dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const futureDates = sortedDates.filter(
    (bd) => new Date(bd.blockedDate) >= today
  );

  return (
    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="flex items-center gap-2 text-base text-white">
          <Ban className="h-4 w-4 text-red-400" />
          {t.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        {futureDates.length === 0 ? (
          <div className="py-6 text-center">
            <Calendar className="mx-auto mb-2 h-8 w-8 text-white/20" />
            <p className="text-sm text-white/50">{t.empty}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {futureDates.map((bd) => {
              const date = new Date(bd.blockedDate);
              const formattedDate = date.toLocaleDateString(locale, {
                weekday: "short",
                day: "numeric",
                month: "short",
              });
              const isConfirming = confirmDeleteId === bd.id;
              const isDeleting = deletingId === bd.id;

              return (
                <div
                  key={bd.id}
                  className={cn(
                    "rounded-xl border p-3 transition",
                    isConfirming
                      ? "border-red-500/30 bg-red-500/5"
                      : "border-white/10 bg-white/[0.02]"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-white/50" />
                        <span className="text-sm font-medium text-white">
                          {formattedDate}
                        </span>
                      </div>
                      
                      {bd.allDay ? (
                        <span className="mt-1 inline-block rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs text-red-300">
                          {t.allDay}
                        </span>
                      ) : (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {bd.blockedTimes.map((time) => (
                            <span
                              key={time}
                              className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300"
                            >
                              <Clock className="h-2.5 w-2.5" />
                              {time}
                            </span>
                          ))}
                        </div>
                      )}

                      {bd.reason && (
                        <p className="mt-2 text-xs text-white/50">{bd.reason}</p>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      {isConfirming ? (
                        <div className="flex gap-1">
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => setConfirmDeleteId(null)}
                            disabled={isDeleting}
                          >
                            ✕
                          </Button>
                          <Button
                            size="icon-xs"
                            variant="destructive"
                            onClick={() => handleDelete(bd.id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          onClick={() => setConfirmDeleteId(bd.id)}
                          className="text-white/40 hover:text-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {isConfirming && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-red-300">
                      <AlertCircle className="h-3 w-3" />
                      {t.confirmDelete}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
