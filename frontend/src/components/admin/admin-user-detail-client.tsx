"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { useRouter } from "next/navigation";
import { adminApi, type UserResponse } from "@/lib/api";
import { toast } from "sonner";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  ShieldCheck,
  ShieldOff,
  Ban,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  Globe,
  Calendar,
  Award,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { StatusBadge } from "@/components/admin/status-badge";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// ─── Role badge ──────────────────────────────────────────────────────────────

const ROLE_STYLES: Record<string, string> = {
  admin:
    "bg-amber-500/10 text-amber-400 border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  diver:
    "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20",
  staff:
    "bg-violet-500/10 text-violet-400 border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20",
  client:
    "bg-slate-500/10 text-slate-400 border-slate-500/20 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
};

function RoleBadge({ role }: { role: string }) {
  const style =
    ROLE_STYLES[role] ??
    "bg-slate-500/10 text-slate-400 border-slate-500/20 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {role}
    </span>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AdminUserDetailClient({ userId }: { userId: string }) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const router = useRouter();

  // ── Data state ──────────────────────────────────────────────────────────────
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Edit dialog ─────────────────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    username: "",
  });
  const [saving, setSaving] = useState(false);

  // ── Delete dialog ───────────────────────────────────────────────────────────
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Blacklist state ─────────────────────────────────────────────────────────
  const [blacklistOpen, setBlacklistOpen] = useState(false);
  const [blacklisting, setBlacklisting] = useState(false);

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadUser = useCallback(() => {
    setLoading(true);
    setError(null);
    adminApi
      .getUser(userId)
      .then(setUser)
      .catch(() => {
        const msg = t("loadError");
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [userId, t]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // ── Format helpers ──────────────────────────────────────────────────────────

  const formatDate = (dateString: string): string =>
    format.dateTime(new Date(dateString), {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // ── Edit handlers ───────────────────────────────────────────────────────────

  const openEdit = useCallback(() => {
    if (!user) {return;}
    setEditForm({
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      username: user.username ?? "",
    });
    setEditOpen(true);
  }, [user]);

  const handleSaveEdit = useCallback(async () => {
    if (!user) {return;}
    setSaving(true);
    try {
      await adminApi.updateUser(user.id, {
        first_name: editForm.first_name || null,
        last_name: editForm.last_name || null,
        email: editForm.email,
        phone: editForm.phone || null,
        username: editForm.username,
      });
      toast.success(t("userUpdated"));
      setEditOpen(false);
      loadUser();
    } catch {
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  }, [user, editForm, t, loadUser]);

  // ── Delete handler ──────────────────────────────────────────────────────────

  const handleDelete = useCallback(async () => {
    if (!user) {return;}
    setDeleting(true);
    try {
      await adminApi.deleteUser(user.id);
      toast.success(t("userDeleted"));
      router.push("/admin/users");
    } catch {
      toast.error(t("saveError"));
    } finally {
      setDeleting(false);
    }
  }, [user, t, router]);

  // ── Blacklist handler ───────────────────────────────────────────────────────

  const handleBlacklistToggle = useCallback(async () => {
    if (!user) {return;}
    setBlacklisting(true);
    const isBlocked = user.status === "blocked";
    try {
      if (isBlocked) {
        await adminApi.unblacklistUser(user.id);
        toast.success(t("userUnblacklisted"));
      } else {
        await adminApi.blacklistUser(user.id);
        toast.success(t("userBlacklisted"));
      }
      setBlacklistOpen(false);
      loadUser();
    } catch {
      toast.error(t("saveError"));
    } finally {
      setBlacklisting(false);
    }
  }, [user, t, loadUser]);

  // ── Loading state ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-6 w-24 animate-pulse rounded bg-slate-800" />
          <div className="h-8 w-48 animate-pulse rounded bg-slate-800" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="h-48 animate-pulse rounded-xl border border-slate-800 bg-slate-900/50"
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────

  if (error || !user) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/users"
          className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToUsers")}
        </Link>
        <div className="rounded-lg bg-red-500/20 px-4 py-3 text-red-400 dark:bg-red-500/10 dark:text-red-300">
          {error ?? t("loadError")}
        </div>
      </div>
    );
  }

  const displayName =
    user.first_name || user.last_name
      ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
      : (user.username ?? "");

  const dp = user.diver_profile;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/users"
            className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToUsers")}
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={openEdit}
            className="text-slate-300 hover:text-cyan-400 dark:text-slate-400 dark:hover:text-cyan-400"
          >
            <Pencil className="mr-1.5 h-4 w-4" />
            {t("edit")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBlacklistOpen(true)}
            className={
              user.status === "blocked"
                ? "text-emerald-400 hover:text-emerald-300 dark:text-emerald-400 dark:hover:text-emerald-300"
                : "text-slate-300 hover:text-orange-400 dark:text-slate-400 dark:hover:text-orange-400"
            }
          >
            {user.status === "blocked" ? (
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
            ) : (
              <Ban className="mr-1.5 h-4 w-4" />
            )}
            {user.status === "blocked" ? t("unblacklist") : t("blacklist")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            className="text-slate-300 hover:text-red-400 dark:text-slate-400 dark:hover:text-red-400"
          >
            <Trash2 className="mr-1.5 h-4 w-4" />
            {t("delete")}
          </Button>
        </div>
      </div>

      {/* ── User identity ───────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-white md:text-2xl">
              {displayName}
            </h1>
            <p className="mt-1 text-sm text-slate-400">@{user.username}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={user.status ?? ""} />
            <RoleBadge role={user.admin ? "admin" : "diver"} />
          </div>
        </div>
      </div>

      {/* ── Info cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Contact */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 md:p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {t("userInfo")}
          </h2>
          <dl className="space-y-3 text-sm">
            <InfoRow icon={Mail} label={t("email")} value={user.email ?? ""}>
              <span
                className={`ml-2 text-xs ${user.email_verified ? "text-emerald-400" : "text-red-400"}`}
              >
                {user.email_verified
                  ? tCommon("yes")
                  : `(${t("notVerified")})`}
              </span>
            </InfoRow>
            {user.phone && (
              <InfoRow icon={Phone} label={t("phone")} value={user.phone ?? ""} />
            )}
            {user.preferred_locale && (
              <InfoRow
                icon={Globe}
                label={t("preferredLanguage")}
                value={user.preferred_locale ?? ""}
              />
            )}
            <InfoRow
              icon={Calendar}
              label={t("createdAt")}
              value={formatDate(user.created_at)}
            />
          </dl>
        </div>

        {/* Diver profile */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 md:p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {t("certification")}
          </h2>
          {dp?.certification_level ? (
            <dl className="space-y-3 text-sm">
              <InfoRow
                icon={Award}
                label={t("certificationLevel")}
                value={String(dp.certification_level ?? "")}
              />
              {dp.certification_org !== null && dp.certification_org !== undefined && (
                <InfoRow
                  icon={Award}
                  label={t("certificationOrg")}
                  value={String(dp.certification_org)}
                />
              )}
              <InfoRow
                icon={Award}
                label={t("totalDives")}
                value={String(dp.total_dives ?? 0)}
              />
            </dl>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-500">
              {t("noCertification")}
            </p>
          )}
        </div>

        {/* Account */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 md:p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {t("accountStatus")}
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-slate-500 dark:text-slate-500">
                {t("status")}
              </dt>
              <dd className="mt-1">
                <StatusBadge status={user.status ?? ""} />
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-500">
                {t("roles")}
              </dt>
              <dd className="mt-1 flex flex-wrap gap-1">
                <RoleBadge role={user.admin ? "admin" : "diver"} />
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-500">
                {t("id")}
              </dt>
              <dd className="mt-1 font-mono text-xs text-slate-400 dark:text-slate-400">
                {user.id}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* ── Quick admin toggle ──────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 md:p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {t("quickActions")}
        </h2>
        <div className="flex flex-wrap gap-3">
          <QuickAdminToggle user={user} t={t} onSuccess={loadUser} />
        </div>
      </div>

      {/* ── Edit dialog ─────────────────────────────────────────────────── */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          if (!open) {setEditOpen(false);}
        }}
      >
        <DialogContent className="border-slate-800 bg-slate-900 dark:border-slate-700 dark:bg-slate-900 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white dark:text-slate-100">
              {t("editUser")}
            </DialogTitle>
            <DialogDescription className="text-slate-400 dark:text-slate-500">
              {t("editUserDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <FormField
              label={t("firstName")}
              value={editForm.first_name}
              onChange={(v) => setEditForm((f) => ({ ...f, first_name: v }))}
            />
            <FormField
              label={t("lastName")}
              value={editForm.last_name}
              onChange={(v) => setEditForm((f) => ({ ...f, last_name: v }))}
            />
            <FormField
              label={t("username")}
              value={editForm.username}
              onChange={(v) => setEditForm((f) => ({ ...f, username: v }))}
            />
            <FormField
              label={t("email")}
              value={editForm.email}
              onChange={(v) => setEditForm((f) => ({ ...f, email: v }))}
              type="email"
            />
            <FormField
              label={t("phone")}
              value={editForm.phone}
              onChange={(v) => setEditForm((f) => ({ ...f, phone: v }))}
              type="tel"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={saving}
              className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={saving}
              className="bg-cyan-600 text-white hover:bg-cyan-700 dark:bg-cyan-600 dark:hover:bg-cyan-700"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete confirmation ──────────────────────────────────────────── */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("confirmDeleteUser")}
        description={t("confirmDeleteUserDescription", { user: user.email ?? "" })}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleting}
      />

      {/* ── Blacklist confirmation ───────────────────────────────────────── */}
      <ConfirmDialog
        open={blacklistOpen}
        onOpenChange={setBlacklistOpen}
        title={
          user.status === "blocked"
            ? t("confirmUnblacklist")
            : t("confirmBlacklist")
        }
        description={
          user.status === "blocked"
            ? t("confirmUnblacklistDescription", { user: user.email ?? "" })
            : t("confirmBlacklistDescription", { user: user.email ?? "" })
        }
        confirmLabel={
          user.status === "blocked" ? t("unblacklist") : t("blacklist")
        }
        cancelLabel={t("cancel")}
        variant={user.status === "blocked" ? "default" : "destructive"}
        onConfirm={handleBlacklistToggle}
        loading={blacklisting}
      />
    </div>
  );
}

// ─── Quick admin toggle button ───────────────────────────────────────────────

function QuickAdminToggle({
  user,
  t,
  onSuccess,
}: {
  user: UserResponse;
  t: ReturnType<typeof useTranslations<"admin">>;
  onSuccess: () => void;
}) {
  const [toggling, setToggling] = useState(false);
  const isAdminUser = user.admin;

  const handleToggle = async () => {
    setToggling(true);
    try {
      await adminApi.updateUser(user.id, { admin: !isAdminUser });
      toast.success(isAdminUser ? t("adminRoleRemoved") : t("adminRoleAdded"));
      onSuccess();
    } catch {
      toast.error(t("saveError"));
    } finally {
      setToggling(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={toggling}
      className={
        isAdminUser
          ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20"
          : "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-amber-500/30 hover:text-amber-400 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:border-amber-500/30"
      }
    >
      {toggling ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
      ) : isAdminUser ? (
        <ShieldOff className="mr-1.5 h-4 w-4" />
      ) : (
        <ShieldCheck className="mr-1.5 h-4 w-4" />
      )}
      {isAdminUser ? t("removeAdminRole") : t("addAdminRole")}
    </Button>
  );
}

// ─── Info row helper ─────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-500" />
      <div className="min-w-0 flex-1">
        <dt className="text-slate-500 dark:text-slate-500">{label}</dt>
        <dd className="mt-0.5 flex items-center text-slate-200 dark:text-slate-300">
          <span className="truncate">{value}</span>
          {children}
        </dd>
      </div>
    </div>
  );
}

// ─── Form field helper ───────────────────────────────────────────────────────

function FormField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm text-slate-400 dark:text-slate-500">
        {label}
      </label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-slate-700 bg-slate-800 text-slate-200 placeholder:text-slate-500 focus-visible:border-cyan-500 focus-visible:ring-cyan-500/50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus-visible:border-cyan-500 dark:focus-visible:ring-cyan-500/50"
      />
    </div>
  );
}
