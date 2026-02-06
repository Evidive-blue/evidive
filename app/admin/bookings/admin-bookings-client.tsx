"use client";

// Force recompile - null safety fixes applied
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowLeft,
  DollarSign,
  Users,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n/use-translations";

interface Booking {
  id: string;
  reference: string;
  diveDate: string;
  diveTime: string | null;
  participants: number;
  totalPrice: number;
  status: "PENDING" | "CONFIRMED" | "PAID" | "RUNNING" | "COMPLETED" | "CANCELLED" | "NOSHOW" | "REMOVED";
  paymentStatus: string;
  specialRequests: string | null;
  createdAt: string;
  center: {
    id: string;
    slug: string;
    name: unknown;
    city: string;
    country: string;
  };
  diver: {
    id: string;
    email: string;
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
  } | null;
  service: {
    id: string;
    name: unknown;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Stats {
  totalRevenue: number;
  statusCounts: Record<string, number>;
}

const STATUS_STYLES = {
  PENDING: { color: "text-amber-400", bg: "bg-amber-500/20" },
  CONFIRMED: { color: "text-blue-400", bg: "bg-blue-500/20" },
  PAID: { color: "text-emerald-400", bg: "bg-emerald-500/20" },
  RUNNING: { color: "text-cyan-400", bg: "bg-cyan-500/20" },
  COMPLETED: { color: "text-green-400", bg: "bg-green-500/20" },
  CANCELLED: { color: "text-red-400", bg: "bg-red-500/20" },
  NOSHOW: { color: "text-gray-400", bg: "bg-gray-500/20" },
  REMOVED: { color: "text-red-600", bg: "bg-red-800/20" },
};

export function AdminBookingsClient() {
  const t = useTranslations("adminBookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const getStatusLabel = (status: string) => t(`status.${status}`);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/bookings?${params}`);
      const data = await res.json();

      if (res.ok) {
        setBookings(data.bookings);
        setPagination(data.pagination);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    setActionLoading(bookingId);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchBookings();
      }
    } catch (error) {
      console.error("Error updating booking:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const getName = (obj: unknown): string => {
    if (typeof obj === "string") return obj;
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      const o = obj as Record<string, unknown>;
      return (o.en as string) || (o.fr as string) || t("unknown");
    }
    return t("unknown");
  };

  const getDiverName = (diver: Booking["diver"]) => {
    if (!diver) return t("guest");
    if (diver.displayName) return diver.displayName;
    if (diver.firstName || diver.lastName) {
      return `${diver.firstName || ""} ${diver.lastName || ""}`.trim();
    }
    return diver.email.split("@")[0];
  };

  return (
    <div className="min-h-screen pb-16 pt-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="mb-4 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToAdmin")}
          </Link>
          <h1 className="text-3xl font-bold text-white">{t("title")}</h1>
          <p className="mt-2 text-white/60">
            {t("results", { count: pagination?.total || 0 })}
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/20">
                  <DollarSign className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-lg font-bold text-white">
                    {stats.totalRevenue.toLocaleString()}€
                  </p>
                  <p className="text-xs text-white/60">{t("totalRevenue")}</p>
                </div>
              </div>
            </div>
            {(["PENDING", "CONFIRMED", "PAID"] as const).map((key) => {
              const styles = STATUS_STYLES[key];
              return (
                <div key={key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", styles.bg)}>
                      <Calendar className={cn("h-5 w-5", styles.color)} />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">
                        {stats.statusCounts[key] || 0}
                      </p>
                      <p className="text-xs text-white/60">{getStatusLabel(key)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-white"
          >
            <option value="">{t("status.ALL")}</option>
            {Object.keys(STATUS_STYLES).map((key) => (
              <option key={key} value={key}>
                {getStatusLabel(key)}
              </option>
            ))}
          </select>
        </div>

        {/* Bookings List */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-20 text-center">
              <Calendar className="mx-auto h-12 w-12 text-white/20" />
              <p className="mt-4 text-white/60">{t("noBookings")}</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {bookings.map((booking) => {
                const statusStyles = STATUS_STYLES[booking.status];
                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 hover:bg-white/5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* Center & Service */}
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">
                            {getName(booking.center.name)}
                          </p>
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusStyles.bg, statusStyles.color)}>
                            {getStatusLabel(booking.status)}
                          </span>
                        </div>
                        
                        {booking.service && (
                          <p className="mt-1 text-sm text-white/60">
                            {getName(booking.service.name)}
                          </p>
                        )}

                        {/* Details */}
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-white/60">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(booking.diveDate).toLocaleDateString()}
                            {booking.diveTime && ` ${new Date(booking.diveTime).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {t("participants", { count: booking.participants })}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {booking.center.city}, {booking.center.country}
                          </span>
                        </div>

                        {/* Diver */}
                        <div className="mt-2 text-sm">
                          <span className="text-white/40">{t("client")}: </span>
                          <span className="text-white/80">{getDiverName(booking.diver)}</span>
                          {booking.diver && (
                            <span className="text-white/40"> ({booking.diver.email})</span>
                          )}
                        </div>
                      </div>

                      {/* Price & Actions */}
                      <div className="text-right">
                        <p className="text-xl font-bold text-white">
                          {booking.totalPrice}€
                        </p>
                        <p className="text-xs text-white/40">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </p>

                        {/* Quick Actions */}
                        {actionLoading === booking.id ? (
                          <Loader2 className="mt-2 h-5 w-5 animate-spin text-white/40" />
                        ) : (
                          <div className="mt-2 flex gap-1">
                            {booking.status === "PENDING" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleStatusChange(booking.id, "CONFIRMED")}
                                  className="h-7 w-7 p-0 text-green-400 hover:bg-green-500/20"
                                  title="Confirmer"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleStatusChange(booking.id, "CANCELLED")}
                                  className="h-7 w-7 p-0 text-red-400 hover:bg-red-500/20"
                                  title="Annuler"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {booking.status === "CONFIRMED" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStatusChange(booking.id, "COMPLETED")}
                                className="h-7 w-7 p-0 text-green-400 hover:bg-green-500/20"
                                title="Marquer terminée"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
              <p className="text-sm text-white/60">
                {t("pagination", { current: pagination.page, total: pagination.totalPages })}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-8 border-white/10 bg-white/5"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="h-8 border-white/10 bg-white/5"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
