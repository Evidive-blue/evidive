"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { toast } from "sonner";
import { centerApi, type BookingResponse } from "@/lib/api";
import { CheckCircle, XCircle, Eye, BookOpen } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { PageSkeleton } from "@/components/admin/loading-skeleton";
import { StatusBadge } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, useConfirmDialog } from "@/components/admin/confirm-dialog";

type StatusFilter = "all" | "pending" | "confirmed" | "completed" | "cancelled";

export function DashboardBookingsClient() {
  const t = useTranslations("dashboard");
  const format = useFormatter();
  const [bookings, setBookings] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const confirmDialog = useConfirmDialog();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter === "all" ? {} : { status: filter };
      const data = await centerApi.getBookings(params);
      setBookings(data);
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [filter, t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleConfirm = async (id: string) => {
    try {
      await centerApi.confirmBooking(id);
      toast.success(t("bookingConfirmed"));
      load();
    } catch {
      toast.error(t("saveError"));
    }
  };

  const handleCancel = (id: string) => {
    confirmDialog.confirm({
      title: t("cancelBookingAction"),
      description: t("confirmDelete"),
      onConfirm: async () => {
        try {
          await centerApi.cancelBooking(id);
          toast.success(t("bookingCancelled"));
          load();
        } catch {
          toast.error(t("saveError"));
        }
      },
    });
  };

  const filters: StatusFilter[] = ["all", "pending", "confirmed", "completed", "cancelled"];

  const selected = selectedId
    ? bookings.find((b) => b.id === selectedId)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader titleKey="bookings" namespace="dashboard" />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button
            key={f}
            onClick={() => setFilter(f)}
            variant={filter === f ? "default" : "outline"}
            className={
              filter === f
                ? "bg-cyan-600 hover:bg-cyan-700 text-white"
                : "border-slate-700 bg-slate-800 text-slate-300"
            }
          >
            {f === "all" ? t("totalBookings") : t(`${f}Bookings`)}
          </Button>
        ))}
      </div>

      {loading ? (
        <PageSkeleton />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={t("noBookings")}
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="rounded-xl border border-slate-800 bg-slate-900 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <StatusBadge status={booking.status} />
                  <div>
                    <p className="font-medium">{booking.service?.name ?? "—"}</p>
                    <p className="text-sm text-slate-400">
                      {booking.client?.first_name ?? ""} {booking.client?.last_name ?? ""}
                    </p>
                    <p className="text-xs text-slate-500">
                      {booking.start_time ? format.dateTime(new Date(booking.start_time), { dateStyle: "short", timeStyle: "short" }) : "—"} &ndash;{" "}
                      {booking.end_time ? format.dateTime(new Date(booking.end_time), { timeStyle: "short" }) : "—"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {booking.participants_count} {t("participants").toLowerCase()} &middot;{" "}
                      {format.number(parseFloat(String(booking.price ?? 0)), { style: "currency", currency: "EUR" })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {booking.status === "pending" && (
                    <>
                      <Button
                        onClick={() => handleConfirm(booking.id)}
                        variant="ghost"
                        size="icon"
                        className="text-emerald-400 hover:bg-emerald-500/10"
                        aria-label={t("confirmBooking")}
                      >
                        <CheckCircle className="h-5 w-5" />
                      </Button>
                      <Button
                        onClick={() => handleCancel(booking.id)}
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:bg-red-500/10"
                        aria-label={t("cancelBooking")}
                      >
                        <XCircle className="h-5 w-5" />
                      </Button>
                    </>
                  )}
                  <Button
                    onClick={() =>
                      setSelectedId(selectedId === booking.id ? null : booking.id)
                    }
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:bg-slate-800 hover:text-white"
                    aria-label={t("viewBooking")}
                  >
                    <Eye className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Expanded details */}
              {selected?.id === booking.id && (
                <div className="mt-4 space-y-2 border-t border-slate-800 pt-4 text-sm text-slate-300">
                  <p>
                    <strong>{t("client")}:</strong> {booking.client?.email ?? "—"}
                    {booking.client?.phone ? ` · ${booking.client.phone}` : ""}
                  </p>
                  {booking.assigned_user && (
                    <p>
                      <strong>{t("staff")}:</strong>{" "}
                      {[booking.assigned_user.first_name, booking.assigned_user.last_name].filter(Boolean).join(" ") || booking.assigned_user.email}
                    </p>
                  )}
                  {booking.location && (
                    <p>
                      <strong>{t("location")}:</strong> {booking.location.name}{" "}
                      {booking.location.city && `(${booking.location.city})`}
                    </p>
                  )}
                  {booking.notes && (
                    <p>
                      <strong>{t("notes")}:</strong> {booking.notes}
                    </p>
                  )}
                  {booking.guests && booking.guests.length > 0 && (
                    <p>
                      <strong>{t("guests")}:</strong>{" "}
                      {booking.guests
                        .map((g) => `${g.first_name} ${g.last_name}`)
                        .join(", ")}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={confirmDialog.onOpenChange}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        confirmLabel={t("cancelBooking")}
        cancelLabel={t("viewBooking")}
      />
    </div>
  );
}
