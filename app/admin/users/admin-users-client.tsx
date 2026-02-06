"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldOff,
  Ban,
  CheckCircle,
  XCircle,
  Mail,
  Calendar,
  Building2,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n/use-translations";

interface User {
  id: string;
  email: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: "DIVER" | "ADMIN";
  emailVerified: boolean;
  isActive: boolean;
  isBlacklisted: boolean;
  createdAt: string;
  _count: {
    centers: number;
    bookings: number;
    reviews: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function AdminUsersClient() {
  const t = useTranslations("adminUsers");
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();

      if (res.ok) {
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    const debounce = setTimeout(fetchUsers, 300);
    return () => clearTimeout(debounce);
  }, [fetchUsers]);

  const handleAction = async (userId: string, action: string, value: boolean | string) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [action]: value }),
      });

      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Error updating user:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const getName = (user: User) => {
    if (user.displayName) return user.displayName;
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user.email.split("@")[0];
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

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-xl border-white/10 bg-white/5 pl-10 text-white"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-white"
            >
              <option value="">{t("allRoles")}</option>
              <option value="DIVER">{t("roles.DIVER")}</option>
              <option value="ADMIN">{t("roles.ADMIN")}</option>
            </select>
          </div>
        </div>

        {/* Users List */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-20 text-center">
              <Users className="mx-auto h-12 w-12 text-white/20" />
              <p className="mt-4 text-white/60">{t("noUsers")}</p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {users.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-4 hover:bg-white/5"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 overflow-hidden">
                      {user.avatarUrl ? (
                        <Image
                          src={user.avatarUrl}
                          alt={getName(user)}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <span className="text-lg font-bold text-white">
                          {getName(user).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{getName(user)}</p>
                        {user.role === "ADMIN" && (
                          <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-400">
                            {t("roles.ADMIN")}
                          </span>
                        )}
                        {user.isBlacklisted && (
                          <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
                            {t("blacklisted")}
                          </span>
                        )}
                        {!user.isActive && (
                          <span className="rounded-full bg-gray-500/20 px-2 py-0.5 text-xs font-medium text-gray-400">
                            {t("inactive")}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-white/60">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                          {user.emailVerified && (
                            <CheckCircle className="h-3 w-3 text-green-400" />
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-white/40">
                        {user._count.centers > 0 && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {t("centersCount", { count: user._count.centers })}
                          </span>
                        )}
                        <span>{t("bookingsCount", { count: user._count.bookings })}</span>
                        <span>{t("reviewsCount", { count: user._count.reviews })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {actionLoading === user.id ? (
                      <Loader2 className="h-5 w-5 animate-spin text-white/40" />
                    ) : (
                      <>
                        {/* Toggle Admin */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAction(user.id, "role", user.role === "ADMIN" ? "DIVER" : "ADMIN")}
                          className={cn(
                            "h-8 w-8 p-0",
                            user.role === "ADMIN" ? "text-purple-400" : "text-white/40"
                          )}
                          title={user.role === "ADMIN" ? t("demote") : t("promote")}
                        >
                          {user.role === "ADMIN" ? (
                            <Shield className="h-4 w-4" />
                          ) : (
                            <ShieldOff className="h-4 w-4" />
                          )}
                        </Button>

                        {/* Toggle Active */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAction(user.id, "isActive", !user.isActive)}
                          className={cn(
                            "h-8 w-8 p-0",
                            user.isActive ? "text-green-400" : "text-red-400"
                          )}
                          title={user.isActive ? t("deactivate") : t("activate")}
                        >
                          {user.isActive ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                        </Button>

                        {/* Toggle Blacklist */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAction(user.id, "isBlacklisted", !user.isBlacklisted)}
                          className={cn(
                            "h-8 w-8 p-0",
                            user.isBlacklisted ? "text-red-400" : "text-white/40"
                          )}
                          title={user.isBlacklisted ? t("removeBlacklist") : t("addBlacklist")}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>

                        {/* View details */}
                        <Link href={`/admin/users/${user.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-white/10 bg-white/5 text-white"
                          >
                            {t("details")}
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
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
