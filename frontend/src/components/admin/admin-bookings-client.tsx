"use client";

import { useEffect, useState, useCallback, useMemo, Fragment } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { CheckCircle, XCircle, Eye, Filter } from "lucide-react";

interface AdminBookingData {
  id: string;
  client_display_name: string | null;
  center_name: string | null;
  service_name: string | null;
  booking_date: string;
  participants: number;
  total_price: number | string;
  currency: string;
  status: string;
  created_at: string;
}
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/admin/status-badge";
import { TableSkeleton } from "@/components/admin/loading-skeleton";
import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog, useConfirmDialog } from "@/components/admin/confirm-dialog";

type StatusFilter = "all" | "pending" | "confirmed" | "completed" | "cancelled";

export function AdminBookingsClient() {
  const t = useTranslations("admin");
  const format = useFormatter();
  const [allBookings, setAllBookings] = useState<AdminBookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const confirmDialog = useConfirmDialog();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await adminApi.getBookings();
      const mapped = (raw as unknown as AdminBookingData[]).map((b) => ({
        id: b.id,
        client_display_name: b.client_display_name ?? null,
        center_name: b.center_name ?? null,
        service_name: b.service_name ?? null,
        booking_date: b.booking_date,
        participants: b.participants ?? 0,
        total_price: b.total_price,
        currency: b.currency ?? "EUR",
        status: b.status,
        created_at: b.created_at,
      }));
      setAllBookings(mapped);
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const bookings = useMemo(() => {
    let filtered = allBookings;
    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }
    if (dateFrom) {
      filtered = filtered.filter((b) => b.booking_date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((b) => b.booking_date <= dateTo);
    }
    return filtered;
  }, [allBookings, statusFilter, dateFrom, dateTo]);

  const handleConfirm = async (id: string) => {
    try {
      await adminApi.updateBookingStatus(id, "confirmed");
      toast.success(t("bookingConfirmed"));
      load();
    } catch {
      toast.error(t("saveError"));
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await adminApi.updateBookingStatus(id, "cancelled");
      toast.success(t("bookingCancelled"));
      load();
    } catch {
      toast.error(t("saveError"));
    }
  };

  const handleCancelWithConfirm = (id: string) => {
    confirmDialog.confirm({
      title: t("cancelBooking"),
      description: t("cancelBookingConfirm"),
      onConfirm: async () => {
        await handleCancel(id);
      },
    });
  };

  const handleFilter = () => {
    load();
  };

  const selected = selectedId
    ? bookings.find((b) => b.id === selectedId)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader titleKey="bookings" />

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex flex-wrap items-end gap-4">
          {/* Status Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-sm text-slate-400">
              {t("status")}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 transition-colors hover:border-slate-600 focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              <option value="all">{t("all")}</option>
              <option value="pending">{t("pending")}</option>
              <option value="confirmed">{t("confirmed")}</option>
              <option value="completed">{t("completed")}</option>
              <option value="cancelled">{t("cancelled")}</option>
            </select>
          </div>

          {/* Date From */}
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-sm text-slate-400">
              {t("dateFrom")}
            </label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border-slate-700 bg-slate-800 text-slate-200 placeholder:text-slate-500 focus-visible:ring-cyan-500/50 focus-visible:border-cyan-500"
            />
          </div>

          {/* Date To */}
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-sm text-slate-400">
              {t("dateTo")}
            </label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border-slate-700 bg-slate-800 text-slate-200 placeholder:text-slate-500 focus-visible:ring-cyan-500/50 focus-visible:border-cyan-500"
            />
          </div>

          {/* Filter Button */}
          <div>
            <Button
              onClick={handleFilter}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              <Filter className="h-4 w-4" />
              {t("filter")}
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={8} />
      ) : bookings.length === 0 ? (
        <EmptyState
          title={t("noResults")}
          description={t("noBookingsFound")}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("id")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("client")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("service")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("center")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("date")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("status")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("price")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {bookings.map((booking) => (
                <Fragment key={booking.id}>
                  <tr className="transition-colors hover:bg-slate-800/50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-300">
                      {booking.id?.slice(0, 8) ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {booking.client_display_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {booking.service_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {booking.center_name ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-300">
                      {format.dateTime(new Date(booking.booking_date), { dateStyle: "medium" })}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={booking.status} label={t(booking.status)} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-300">
                      {format.number(parseFloat(String(booking.total_price)) || 0, { style: "currency", currency: booking.currency })}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-1">
                        {booking.status === "pending" && (
                          <>
                            <Button
                              onClick={() => handleConfirm(booking.id)}
                              variant="ghost"
                              size="icon-sm"
                              className="text-emerald-400 hover:bg-emerald-500/10"
                              aria-label={t("confirm")}
                              title={t("confirm")}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleCancelWithConfirm(booking.id)}
                              variant="ghost"
                              size="icon-sm"
                              className="text-red-400 hover:bg-red-500/10"
                              aria-label={t("cancel")}
                              title={t("cancel")}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          onClick={() =>
                            setSelectedId(selectedId === booking.id ? null : booking.id)
                          }
                          variant="ghost"
                          size="icon-sm"
                          className="text-slate-400 hover:bg-slate-800 hover:text-white"
                          aria-label={t("view")}
                          title={t("view")}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {selected?.id === booking.id && (
                    <tr>
                      <td colSpan={8} className="px-4 py-4">
                        <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-800/50 p-4 text-sm">
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                              <p className="mb-1 text-xs font-medium uppercase text-slate-500">
                                {t("client")}
                              </p>
                              <p className="text-slate-300">
                                {booking.client_display_name ?? "—"}
                              </p>
                            </div>
                            <div>
                              <p className="mb-1 text-xs font-medium uppercase text-slate-500">
                                {t("participants")}
                              </p>
                              <p className="text-slate-300">{booking.participants}</p>
                            </div>
                            <div>
                              <p className="mb-1 text-xs font-medium uppercase text-slate-500">
                                {t("createdAt")}
                              </p>
                              <p className="text-slate-300">
                                {format.dateTime(new Date(booking.created_at), { dateStyle: "medium", timeStyle: "short" })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={confirmDialog.onOpenChange}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={t("confirm")}
        cancelLabel={t("cancel")}
        variant="destructive"
        onConfirm={confirmDialog.onConfirm}
      />
    </div>
  );
}
