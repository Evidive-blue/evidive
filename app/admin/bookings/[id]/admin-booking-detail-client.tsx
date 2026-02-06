"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Building2,
  CreditCard,
  Tag,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  PENDING: { label: "En attente", color: "bg-amber-500/20 text-amber-400", icon: Clock },
  CONFIRMED: { label: "Confirmé", color: "bg-blue-500/20 text-blue-400", icon: CheckCircle },
  PAID: { label: "Payé", color: "bg-emerald-500/20 text-emerald-400", icon: CreditCard },
  RUNNING: { label: "En cours", color: "bg-cyan-500/20 text-cyan-400", icon: Clock },
  COMPLETED: { label: "Terminé", color: "bg-green-500/20 text-green-400", icon: CheckCircle },
  CANCELLED: { label: "Annulé", color: "bg-red-500/20 text-red-400", icon: XCircle },
  NOSHOW: { label: "No-show", color: "bg-gray-500/20 text-gray-400", icon: XCircle },
  REMOVED: { label: "Supprimé", color: "bg-red-800/20 text-red-600", icon: Trash2 },
} as const;

interface Booking {
  id: string;
  reference: string;
  diveDate: Date;
  diveTime: Date | null;
  status: keyof typeof STATUS_CONFIG;
  totalPrice: number;
  specialRequests: string | null;
  participants: number;
  paymentStatus: string;
  stripePaymentIntentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  cancelledAt: Date | null;
  diver: {
    id: string;
    email: string;
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    phone: string | null;
  } | null;
  center: {
    id: string;
    slug: string;
    name: unknown;
    city: string;
    country: string;
    ownerId: string;
    owner: {
      id: string;
      email: string;
      displayName: string | null;
    } | null;
  };
  service: {
    id: string;
    name: unknown;
    description: unknown;
    price: number;
  } | null;
  couponUses: Array<{
    discountApplied: number;
    coupon: {
      code: string;
      discountType: string;
      discountValue: number;
    };
  }>;
}

interface Props {
  initialBooking: Booking;
}

export function AdminBookingDetailClient({ initialBooking }: Props) {
  const router = useRouter();
  const [booking, setBooking] = useState<Booking>(initialBooking);
  const [loading, setLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [notes, setNotes] = useState(booking.specialRequests || "");

  const getName = (obj: unknown): string => {
    if (typeof obj === "string") return obj;
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      const o = obj as Record<string, unknown>;
      return (o.en as string) || (o.fr as string) || "Inconnu";
    }
    return "Inconnu";
  };

  const handleStatusChange = async (newStatus: string) => {
    setLoading("status");
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        setBooking(data.booking);
      }
    } catch (error) {
      console.error("Error updating booking:", error);
    } finally {
      setLoading(null);
    }
  };

  const handleSaveNotes = async () => {
    setLoading("notes");
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialRequests: notes }),
      });

      if (res.ok) {
        const data = await res.json();
        setBooking(data.booking);
      }
    } catch (error) {
      console.error("Error saving notes:", error);
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async () => {
    setLoading("delete");
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/admin/bookings");
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting booking:", error);
    } finally {
      setLoading(null);
      setDeleteConfirm(false);
    }
  };

  const statusConfig = STATUS_CONFIG[booking.status];
  const StatusIcon = statusConfig.icon;

  const diverName = booking.diver
    ? (booking.diver.displayName ||
        (booking.diver.firstName || booking.diver.lastName
          ? `${booking.diver.firstName || ""} ${booking.diver.lastName || ""}`.trim()
          : booking.diver.email.split("@")[0]))
    : "Guest";

  return (
    <div className="min-h-screen pb-16 pt-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Link
          href="/admin/bookings"
          className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux réservations
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
        >
          {/* Status Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className={cn("flex items-center gap-2 rounded-full px-4 py-2", statusConfig.color)}>
                  <StatusIcon className="h-5 w-5" />
                  {statusConfig.label}
                </span>
                {booking.paymentStatus === "PAID" && (
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-medium text-emerald-400">
                    Payé
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-white/60">
                Réservation #{booking.id.slice(0, 8)}...
              </p>
            </div>
            <p className="text-3xl font-bold text-white">{booking.totalPrice}€</p>
          </div>

          {/* Date & Time */}
          <div className="mt-6 flex items-center gap-6 rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-cyan-400" />
              <div>
                <p className="text-sm text-white/60">Date</p>
                <p className="font-medium text-white">
                  {new Date(booking.diveDate).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            {booking.diveTime && (
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-sm text-white/60">Heure</p>
                  <p className="font-medium text-white">{new Date(booking.diveTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-sm text-white/60">Participants</p>
                <p className="font-medium text-white">{booking.participants}</p>
              </div>
            </div>
          </div>

          {/* Service */}
          {booking.service && (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="mb-2 font-medium text-white">Service réservé</h3>
              <p className="text-lg font-semibold text-cyan-400">{getName(booking.service.name)}</p>
              <p className="mt-1 text-sm text-white/60">{getName(booking.service.description)}</p>
              <p className="mt-2 text-white/80">Prix unitaire: {booking.service.price}€</p>
            </div>
          )}

          {/* Coupon */}
          {booking.couponUses.length > 0 && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <Tag className="h-5 w-5 text-amber-400" />
              <div>
                <p className="text-sm text-white/60">Code promo appliqué</p>
                <p className="font-medium text-white">
                  {booking.couponUses[0].coupon.code} (-{booking.couponUses[0].discountApplied}€)
                </p>
              </div>
            </div>
          )}

          {/* Status Actions */}
          <div className="mt-6 border-t border-white/10 pt-6">
            <h3 className="mb-3 font-medium text-white">Changer le statut</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                <Button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={loading === "status" || booking.status === status}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "border-white/10",
                    booking.status === status ? config.color : "bg-white/5"
                  )}
                >
                  {loading === "status" && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {config.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="mt-6 border-t border-white/10 pt-6">
            <h3 className="mb-3 flex items-center gap-2 font-medium text-white">
              <FileText className="h-4 w-4" />
              Notes internes
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ajouter des notes internes..."
              className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-white placeholder-white/40 focus:border-cyan-500/50 focus:outline-none"
              rows={3}
            />
            {notes !== (booking.specialRequests || "") && (
              <Button
                onClick={handleSaveNotes}
                disabled={loading === "notes"}
                className="mt-2 bg-cyan-600 hover:bg-cyan-700"
                size="sm"
              >
                {loading === "notes" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Sauvegarder
              </Button>
            )}
          </div>

          {/* Delete Action */}
          <div className="mt-6 flex justify-end border-t border-white/10 pt-6">
            {deleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-400">Supprimer définitivement?</span>
                <Button
                  onClick={handleDelete}
                  disabled={loading === "delete"}
                  variant="destructive"
                  size="sm"
                >
                  {loading === "delete" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Oui"
                  )}
                </Button>
                <Button
                  onClick={() => setDeleteConfirm(false)}
                  variant="outline"
                  size="sm"
                  className="border-white/10"
                >
                  Non
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setDeleteConfirm(true)}
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/20"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
            )}
          </div>
        </motion.div>

        {/* Diver Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
        >
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <User className="h-5 w-5" />
            Client
          </h2>
          {booking.diver ? (
            <Link
              href={`/admin/users/${booking.diver.id}`}
              className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
            >
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 overflow-hidden">
                {booking.diver.avatarUrl ? (
                  <Image
                    src={booking.diver.avatarUrl}
                    alt={diverName}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <span className="text-xl font-bold text-white">
                    {diverName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">{diverName}</p>
                <div className="flex flex-wrap gap-4 text-sm text-white/60">
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {booking.diver.email}
                  </span>
                  {booking.diver.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {booking.diver.phone}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-medium text-white">Guest (non-inscrit)</p>
            </div>
          )}
        </motion.div>

        {/* Center Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
        >
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Building2 className="h-5 w-5" />
            Centre de plongée
          </h2>
          <Link
            href={`/admin/centers/${booking.center.id}`}
            className="block rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
          >
            <p className="text-lg font-medium text-white">{getName(booking.center.name)}</p>
            <p className="mt-1 flex items-center gap-1 text-sm text-white/60">
              <MapPin className="h-4 w-4" />
              {booking.center.city}, {booking.center.country}
            </p>
            {booking.center.owner && (
              <p className="mt-2 text-sm text-white/40">
                Propriétaire: {booking.center.owner.displayName || booking.center.owner.email}
              </p>
            )}
          </Link>
        </motion.div>

        {/* Payment Info */}
        {booking.paymentStatus === "PAID" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
          >
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
              <CreditCard className="h-5 w-5" />
              Paiement
            </h2>
            <div className="space-y-2 text-sm">
              <p className="text-white/60">
                Statut: <span className="text-white">{booking.paymentStatus}</span>
              </p>
              {booking.stripePaymentIntentId && (
                <p className="text-white/60">
                  ID Transaction: <span className="font-mono text-white">{booking.stripePaymentIntentId}</span>
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Timeline */}
        <div className="mt-6 text-center text-sm text-white/40">
          <p>Créée le {new Date(booking.createdAt).toLocaleString("fr-FR")}</p>
          {booking.completedAt && (
            <p>Terminée le {new Date(booking.completedAt).toLocaleString("fr-FR")}</p>
          )}
          {booking.cancelledAt && (
            <p>Annulée le {new Date(booking.cancelledAt).toLocaleString("fr-FR")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
