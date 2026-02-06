"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Check,
  X,
  Eye,
  Loader2,
  Search,
  Filter,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n/use-translations";

interface Center {
  id: string;
  slug: string;
  name: { en?: string; fr?: string } | string;
  email: string;
  city: string;
  country: string;
  status: string;
  createdAt: string;
  owner: {
    id: string;
    email: string;
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
  };
  _count: {
    bookings: number;
    reviews: number;
    services: number;
  };
}

const STATUS_OPTIONS = [
  { value: "", key: "all" },
  { value: "PENDING", key: "pending" },
  { value: "APPROVED", key: "approved" },
  { value: "REJECTED", key: "rejected" },
  { value: "SUSPENDED", key: "suspended" },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-500/20 text-amber-400",
  APPROVED: "bg-green-500/20 text-green-400",
  REJECTED: "bg-red-500/20 text-red-400",
  SUSPENDED: "bg-gray-500/20 text-gray-400",
};

function getName(name: Center["name"]): string {
  if (typeof name === "string") return name;
  if (name && typeof name === "object") {
    return name.en || name.fr || "Unnamed";
  }
  return "Unnamed";
}

export default function AdminCentersPage() {
  const t = useTranslations("adminCenters");
  const tCommon = useTranslations("common");
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "";

  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCenters = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      
      const response = await fetch(`/api/admin/centers?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setCenters(data.centers || []);
      }
    } catch (error) {
      console.error("Error fetching centers:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchCenters();
  }, [fetchCenters]);

  const updateCenterStatus = async (
    centerId: string,
    status: "APPROVED" | "REJECTED" | "SUSPENDED"
  ) => {
    setActionLoading(centerId);
    try {
      const response = await fetch(`/api/admin/centers/${centerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        // Refresh the list
        fetchCenters();
      }
    } catch (error) {
      console.error("Error updating center status:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredCenters = centers.filter((center) => {
    if (!searchQuery) return true;
    const name = getName(center.name).toLowerCase();
    const query = searchQuery.toLowerCase();
    return (
      name.includes(query) ||
      center.email.toLowerCase().includes(query) ||
      center.city.toLowerCase().includes(query) ||
      center.country.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen pb-16 pt-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="mb-4 inline-flex items-center text-sm text-white/60 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToAdmin")}
          </Link>
          <h1 className="text-3xl font-bold text-white">{t("title")}</h1>
          <p className="mt-2 text-white/60">
            {t("subtitle")}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              placeholder={tCommon("search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 rounded-xl border-white/10 bg-white/5 pl-10 text-white"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="rounded-xl border-white/10 bg-white/5 text-white"
              >
                <Filter className="mr-2 h-4 w-4" />
                {(() => {
                  const opt = STATUS_OPTIONS.find((o) => o.value === statusFilter);
                  if (!opt) return t("filters.all");
                  return t(`filters.${opt.key}`);
                })()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="border-white/15 bg-slate-900/95 backdrop-blur-xl"
            >
              {STATUS_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={cn(
                    "cursor-pointer text-white/80 hover:text-white",
                    statusFilter === option.value && "text-cyan-400"
                  )}
                >
                  {t(`filters.${option.key}`)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Centers List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        ) : filteredCenters.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
            <Building2 className="mx-auto h-12 w-12 text-white/20" />
            <p className="mt-4 text-white/60">{t("noCenters")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCenters.map((center) => (
              <div
                key={center.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-white">
                        {getName(center.name)}
                      </h3>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          STATUS_COLORS[center.status] || STATUS_COLORS.PENDING
                        )}
                      >
                        {center.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-white/60">
                      {center.city}, {center.country}
                    </p>
                    {center.owner && (
                      <p className="mt-1 text-sm text-white/40">
                        {t("createdBy")} {center.owner.displayName || center.owner.email}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-xs text-white/40">
                      <span>{center._count.services} {tCommon("services")}</span>
                      <span>{center._count.bookings} {tCommon("bookings")}</span>
                      <span>{center._count.reviews} {tCommon("reviews")}</span>
                      <span>
                        {t("createdAt")} {new Date(center.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/admin/centers/${center.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        {t("viewCenter")}
                      </Button>
                    </Link>

                    {center.status === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateCenterStatus(center.id, "APPROVED")}
                          disabled={actionLoading === center.id}
                          className="rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30"
                        >
                          {actionLoading === center.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              {t("approve")}
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateCenterStatus(center.id, "REJECTED")}
                          disabled={actionLoading === center.id}
                          className="rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        >
                          {actionLoading === center.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <X className="mr-2 h-4 w-4" />
                              {t("reject")}
                            </>
                          )}
                        </Button>
                      </>
                    )}

                    {center.status === "APPROVED" && (
                      <Button
                        size="sm"
                        onClick={() => updateCenterStatus(center.id, "SUSPENDED")}
                        disabled={actionLoading === center.id}
                        className="rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                      >
                        {actionLoading === center.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            {t("suspend")}
                          </>
                        )}
                      </Button>
                    )}

                    {(center.status === "REJECTED" ||
                      center.status === "SUSPENDED") && (
                      <Button
                        size="sm"
                        onClick={() => updateCenterStatus(center.id, "APPROVED")}
                        disabled={actionLoading === center.id}
                        className="rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      >
                        {actionLoading === center.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            {t("approve")}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
