"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building2,
  BookOpen,
  Star,
  Shield,
  ShieldOff,
  Ban,
  CheckCircle,
  XCircle,
  Trash2,
  Loader2,
  Award,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  country: string | null;
  role: "DIVER" | "ADMIN";
  certificationLevel: string | null;
  certificationOrg: string | null;
  totalDives: number;
  preferredLanguage: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  emailVerified: boolean;
  emailVerifiedAt: Date | null;
  isActive: boolean;
  isBlacklisted: boolean;
  createdAt: Date;
  updatedAt: Date;
  centers: Array<{
    id: string;
    slug: string;
    name: unknown;
    status: string;
    city: string;
    country: string;
  }>;
  bookings: Array<{
    id: string;
    totalPrice: number;
    status: string;
    diveDate: Date;
    center: {
      name: unknown;
      slug: string;
    };
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
    center: {
      name: unknown;
      slug: string;
    };
  }>;
  _count: {
    centers: number;
    bookings: number;
    reviews: number;
  };
}

interface Props {
  initialUser: User;
}

export function AdminUserDetailClient({ initialUser }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<User>(initialUser);
  const [loading, setLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleAction = async (action: string, value: boolean | string) => {
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [action]: value }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser((prev) => ({ ...prev, ...data.user }));
      }
    } catch (error) {
      console.error("Error updating user:", error);
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async () => {
    setLoading("delete");
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/admin/users");
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setLoading(null);
      setDeleteConfirm(false);
    }
  };

  const getName = (obj: unknown): string => {
    if (typeof obj === "string") return obj;
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      const o = obj as Record<string, unknown>;
      return (o.en as string) || (o.fr as string) || "Inconnu";
    }
    return "Inconnu";
  };

  const fullName = user.displayName || 
    (user.firstName || user.lastName 
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim() 
      : user.email.split("@")[0]);

  return (
    <div className="min-h-screen pb-16 pt-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Link
          href="/admin/users"
          className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste
        </Link>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
        >
          {/* User Header */}
          <div className="flex items-start gap-6">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 overflow-hidden">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={fullName}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <span className="text-3xl font-bold text-white">
                  {fullName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white">{fullName}</h1>
                {user.role === "ADMIN" && (
                  <span className="rounded-full bg-purple-500/20 px-3 py-1 text-sm font-medium text-purple-400">
                    Admin
                  </span>
                )}
                {user.isBlacklisted && (
                  <span className="rounded-full bg-red-500/20 px-3 py-1 text-sm font-medium text-red-400">
                    Blacklisté
                  </span>
                )}
                {!user.isActive && (
                  <span className="rounded-full bg-gray-500/20 px-3 py-1 text-sm font-medium text-gray-400">
                    Inactif
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-white/60">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                  {user.emailVerified && (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  )}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {user.phone}
                  </span>
                )}
              </div>
              {(user.city || user.country) && (
                <p className="mt-1 flex items-center gap-1 text-sm text-white/40">
                  <MapPin className="h-4 w-4" />
                  {[user.city, user.country].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="mt-4 text-white/70">{user.bio}</p>
          )}

          {/* Quick Stats */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <Building2 className="mx-auto h-5 w-5 text-emerald-400" />
              <p className="mt-2 text-2xl font-bold text-white">{user._count.centers}</p>
              <p className="text-xs text-white/60">Centre(s)</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <BookOpen className="mx-auto h-5 w-5 text-blue-400" />
              <p className="mt-2 text-2xl font-bold text-white">{user._count.bookings}</p>
              <p className="text-xs text-white/60">Réservations</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <Star className="mx-auto h-5 w-5 text-amber-400" />
              <p className="mt-2 text-2xl font-bold text-white">{user._count.reviews}</p>
              <p className="text-xs text-white/60">Avis</p>
            </div>
          </div>

          {/* Diving Info */}
          {(user.certificationLevel || user.totalDives > 0) && (
            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="mb-3 font-medium text-white">Informations plongeur</h3>
              <div className="flex flex-wrap gap-4 text-sm text-white/60">
                {user.certificationLevel && (
                  <span className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-cyan-400" />
                    {user.certificationLevel}
                    {user.certificationOrg && ` (${user.certificationOrg})`}
                  </span>
                )}
                <span className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-400" />
                  {user.totalDives} plongées
                </span>
              </div>
            </div>
          )}

          {/* Admin Actions */}
          <div className="mt-6 flex flex-wrap gap-3 border-t border-white/10 pt-6">
            <Button
              onClick={() => handleAction("role", user.role === "ADMIN" ? "DIVER" : "ADMIN")}
              disabled={loading === "role"}
              variant="outline"
              className={cn(
                "border-white/10",
                user.role === "ADMIN" ? "bg-purple-500/20 text-purple-400" : "bg-white/5"
              )}
            >
              {loading === "role" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : user.role === "ADMIN" ? (
                <ShieldOff className="mr-2 h-4 w-4" />
              ) : (
                <Shield className="mr-2 h-4 w-4" />
              )}
              {user.role === "ADMIN" ? "Rétrograder" : "Promouvoir Admin"}
            </Button>

            <Button
              onClick={() => handleAction("isActive", !user.isActive)}
              disabled={loading === "isActive"}
              variant="outline"
              className={cn(
                "border-white/10",
                user.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
              )}
            >
              {loading === "isActive" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : user.isActive ? (
                <XCircle className="mr-2 h-4 w-4" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              {user.isActive ? "Désactiver" : "Activer"}
            </Button>

            <Button
              onClick={() => handleAction("isBlacklisted", !user.isBlacklisted)}
              disabled={loading === "isBlacklisted"}
              variant="outline"
              className={cn(
                "border-white/10",
                user.isBlacklisted ? "bg-red-500/20 text-red-400" : "bg-white/5"
              )}
            >
              {loading === "isBlacklisted" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Ban className="mr-2 h-4 w-4" />
              )}
              {user.isBlacklisted ? "Retirer blacklist" : "Blacklister"}
            </Button>

            {!user.emailVerified && (
              <Button
                onClick={() => handleAction("emailVerified", true)}
                disabled={loading === "emailVerified"}
                variant="outline"
                className="border-white/10 bg-white/5"
              >
                {loading === "emailVerified" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Vérifier email
              </Button>
            )}

            <div className="flex-1" />

            {deleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-400">Confirmer?</span>
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
                disabled={user._count.centers > 0}
                title={user._count.centers > 0 ? "Impossible de supprimer un utilisateur qui possède des centres" : "Supprimer"}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
            )}
          </div>
        </motion.div>

        {/* Centers owned */}
        {user.centers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
          >
            <h2 className="mb-4 text-lg font-semibold text-white">Centres possédés</h2>
            <div className="space-y-3">
              {user.centers.map((center) => (
                <Link
                  key={center.id}
                  href={`/admin/centers/${center.id}`}
                  className="block rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{getName(center.name)}</p>
                      <p className="text-sm text-white/60">
                        {center.city}, {center.country}
                      </p>
                    </div>
                    <span className={cn(
                      "rounded-full px-2 py-1 text-xs font-medium",
                      center.status === "APPROVED" 
                        ? "bg-green-500/20 text-green-400"
                        : center.status === "PENDING"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-red-500/20 text-red-400"
                    )}>
                      {center.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent Bookings */}
        {user.bookings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
          >
            <h2 className="mb-4 text-lg font-semibold text-white">Réservations récentes</h2>
            <div className="space-y-3">
              {user.bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <div>
                    <p className="font-medium text-white">{getName(booking.center.name)}</p>
                    <p className="text-sm text-white/60">
                      {new Date(booking.diveDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-white">{booking.totalPrice}€</p>
                    <span className={cn(
                      "text-xs",
                      booking.status === "COMPLETED" ? "text-green-400" :
                      booking.status === "CONFIRMED" ? "text-blue-400" :
                      booking.status === "CANCELLED" ? "text-red-400" :
                      "text-amber-400"
                    )}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Meta info */}
        <div className="mt-6 text-center text-sm text-white/40">
          <p>Inscrit le {new Date(user.createdAt).toLocaleDateString()}</p>
          <p>Dernière mise à jour: {new Date(user.updatedAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
