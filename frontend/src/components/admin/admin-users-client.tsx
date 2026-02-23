"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { adminApi, type UserResponse } from "@/lib/api";
import { toast } from "sonner";
import {
  Pencil,
  Trash2,
  ShieldCheck,
  ShieldOff,
  Ban,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import {
  AdminTable,
  type ColumnDef,
  type FilterDef,
} from "@/components/admin/admin-table";
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

// ─── Component ───────────────────────────────────────────────────────────────

export function AdminUsersClient() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const format = useFormatter();

  // ── Data state ──────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Edit dialog ─────────────────────────────────────────────────────────────
  const [editUser, setEditUser] = useState<UserResponse | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    username: "",
  });
  const [saving, setSaving] = useState(false);

  // ── Delete dialog ───────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<UserResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Blacklist state ─────────────────────────────────────────────────────────
  const [blacklistTarget, setBlacklistTarget] = useState<UserResponse | null>(
    null
  );
  const [blacklisting, setBlacklisting] = useState(false);

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadUsers = useCallback(() => {
    setLoading(true);
    setError(null);
    adminApi
      .getUsers()
      .then(setUsers)
      .catch(() => {
        const msg = t("loadError");
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // ── Format helpers ──────────────────────────────────────────────────────────

  const formatDate = (dateString: string): string =>
    format.dateTime(new Date(dateString), {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  // ── Edit handlers ───────────────────────────────────────────────────────────

  const openEdit = useCallback((user: UserResponse) => {
    setEditUser(user);
    setEditForm({
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      username: user.username ?? "",
    });
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editUser) {return;}
    setSaving(true);
    try {
      await adminApi.updateUser(editUser.id, {
        first_name: editForm.first_name || null,
        last_name: editForm.last_name || null,
        email: editForm.email,
        phone: editForm.phone || null,
        username: editForm.username,
      });
      toast.success(t("userUpdated"));
      setEditUser(null);
      loadUsers();
    } catch {
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  }, [editUser, editForm, t, loadUsers]);

  // ── Delete handler ──────────────────────────────────────────────────────────

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) {return;}
    setDeleting(true);
    try {
      await adminApi.deleteUser(deleteTarget.id);
      toast.success(t("userDeleted"));
      setDeleteTarget(null);
      loadUsers();
    } catch {
      toast.error(t("saveError"));
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, t, loadUsers]);

  // ── Blacklist handler ───────────────────────────────────────────────────────

  const handleBlacklistToggle = useCallback(async () => {
    if (!blacklistTarget) {return;}
    setBlacklisting(true);
    const isBlocked = blacklistTarget.status === "blocked";
    try {
      if (isBlocked) {
        await adminApi.unblacklistUser(blacklistTarget.id);
        toast.success(t("userUnblacklisted"));
      } else {
        await adminApi.blacklistUser(blacklistTarget.id);
        toast.success(t("userBlacklisted"));
      }
      setBlacklistTarget(null);
      loadUsers();
    } catch {
      toast.error(t("saveError"));
    } finally {
      setBlacklisting(false);
    }
  }, [blacklistTarget, t, loadUsers]);

  // ── Quick role toggle (admin) ───────────────────────────────────────────────

  const handleQuickAdminToggle = useCallback(
    async (user: UserResponse) => {
      const wasAdmin = user.role === "admin_diver" || user.admin === true;
      const newRole = wasAdmin ? "diver" : "admin_diver";

      try {
        await adminApi.updateUserRole(user.id, newRole);
        toast.success(wasAdmin ? t("adminRoleRemoved") : t("adminRoleAdded"));
        loadUsers();
      } catch {
        toast.error(t("saveError"));
      }
    },
    [t, loadUsers]
  );

  // ── Table columns ───────────────────────────────────────────────────────────

  const columns: ColumnDef<UserResponse>[] = [
    {
      key: "name",
      labelKey: "name",
      accessor: (u) =>
        u.first_name || u.last_name
          ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim()
          : u.username,
      render: (u) => (
        <div className="flex flex-col">
          <span className="font-medium text-white dark:text-slate-100">
            {u.first_name || u.last_name
              ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim()
              : u.username}
          </span>
          {(u.first_name || u.last_name) && (
            <span className="text-xs text-slate-500 dark:text-slate-500">
              @{u.username}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "email",
      labelKey: "email",
      accessor: (u) => u.email ?? "",
      render: (u) => (
        <span className="text-slate-300 dark:text-slate-400">{u.email ?? "—"}</span>
      ),
    },
    {
      key: "roles",
      labelKey: "roles",
      sortable: false,
      render: (u) => {
        const isAdmin = u.role === "admin_diver" || u.admin === true;
        return (
          <div className="flex flex-wrap gap-1">
            <RoleBadge role={isAdmin ? "admin" : "diver"} />
          </div>
        );
      },
    },
    {
      key: "status",
      labelKey: "status",
      accessor: (u) => u.status ?? "",
      render: (u) => <StatusBadge status={u.status ?? ""} />,
    },
    {
      key: "display_name",
      labelKey: "displayName",
      sortable: false,
      render: (u) => (
        <span className="text-slate-300 dark:text-slate-400">
          {u.display_name ?? "—"}
        </span>
      ),
    },
    {
      key: "created_at",
      labelKey: "createdAt",
      accessor: (u) => u.created_at,
      render: (u) => (
        <span className="text-slate-400 dark:text-slate-500">
          {formatDate(u.created_at)}
        </span>
      ),
    },
  ];

  // ── Table filters ───────────────────────────────────────────────────────────

  const filters: FilterDef[] = [
    {
      key: "status",
      labelKey: "status",
      options: [
        { value: "active", label: t("active") },
        { value: "pending", label: t("pending") },
        { value: "blocked", label: t("blocked") },
      ],
    },
  ];

  // ── Error state ─────────────────────────────────────────────────────────────

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <PageHeader titleKey="users" />
        <div className="rounded-lg bg-red-500/20 px-4 py-3 text-red-400 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <PageHeader titleKey="usersManagement" descriptionKey="usersManagementDesc" />

      <AdminTable
        columns={columns}
        data={users}
        rowKey={(u) => u.id}
        searchFields={[
          (u) => u.email ?? "",
          (u) => u.username ?? "",
          (u) => u.first_name ?? "",
          (u) => u.last_name ?? "",
          (u) => u.phone ?? "",
        ]}
        filters={filters}
        loading={loading}
        defaultSortKey="created_at"
        defaultSortDir="desc"
        renderExpanded={(u) => (
          <UserDetailPanel
            user={u}
            t={t}
            tCommon={tCommon}
            formatDate={formatDate}
          />
        )}
        renderActions={(user) => (
          <div className="flex items-center justify-end gap-1">
            {/* Quick admin toggle */}
            {(() => {
              const isAdmin = user.role === "admin_diver" || user.admin === true;
              return (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleQuickAdminToggle(user)}
                  className={
                    isAdmin
                      ? "text-amber-400 hover:text-amber-300 dark:text-amber-400 dark:hover:text-amber-300"
                      : "text-slate-400 hover:text-amber-400 dark:text-slate-500 dark:hover:text-amber-400"
                  }
                  title={isAdmin ? t("removeAdminRole") : t("addAdminRole")}
                >
                  {isAdmin ? (
                    <ShieldOff className="h-4 w-4" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                </Button>
              );
            })()}

            {/* Edit / View detail */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => openEdit(user)}
              className="text-slate-400 hover:text-cyan-400 dark:text-slate-500 dark:hover:text-cyan-400"
              title={t("editUser")}
            >
              <Pencil className="h-4 w-4" />
            </Button>

            {/* Blacklist / Unblacklist */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setBlacklistTarget(user)}
              className={
                user.status === "blocked"
                  ? "text-emerald-400 hover:text-emerald-300 dark:text-emerald-400 dark:hover:text-emerald-300"
                  : "text-slate-400 hover:text-orange-400 dark:text-slate-500 dark:hover:text-orange-400"
              }
              title={
                user.status === "blocked" ? t("unblacklist") : t("blacklist")
              }
            >
              {user.status === "blocked" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Ban className="h-4 w-4" />
              )}
            </Button>

            {/* Delete */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setDeleteTarget(user)}
              className="text-slate-400 hover:text-red-400 dark:text-slate-500 dark:hover:text-red-400"
              title={t("delete")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

      {/* ── Edit user dialog ─────────────────────────────────────────────── */}
      <Dialog
        open={!!editUser}
        onOpenChange={(open) => {
          if (!open) {setEditUser(null);}
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
              onClick={() => setEditUser(null)}
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
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {setDeleteTarget(null);}
        }}
        title={t("confirmDeleteUser")}
        description={t("confirmDeleteUserDescription", {
          user: deleteTarget?.email ?? "",
        })}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleting}
      />

      {/* ── Blacklist confirmation ───────────────────────────────────────── */}
      <ConfirmDialog
        open={!!blacklistTarget}
        onOpenChange={(open) => {
          if (!open) {setBlacklistTarget(null);}
        }}
        title={
          blacklistTarget?.status === "blocked"
            ? t("confirmUnblacklist")
            : t("confirmBlacklist")
        }
        description={
          blacklistTarget?.status === "blocked"
            ? t("confirmUnblacklistDescription", {
                user: blacklistTarget?.email ?? "",
              })
            : t("confirmBlacklistDescription", {
                user: blacklistTarget?.email ?? "",
              })
        }
        confirmLabel={
          blacklistTarget?.status === "blocked"
            ? t("unblacklist")
            : t("blacklist")
        }
        cancelLabel={t("cancel")}
        variant={
          blacklistTarget?.status === "blocked" ? "default" : "destructive"
        }
        onConfirm={handleBlacklistToggle}
        loading={blacklisting}
      />
    </div>
  );
}

// ─── Role badge with specific colors ─────────────────────────────────────────

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

// ─── User detail expanded panel ──────────────────────────────────────────────

function UserDetailPanel({
  user,
  t,
  tCommon,
  formatDate,
}: {
  user: UserResponse;
  t: ReturnType<typeof useTranslations<"admin">>;
  tCommon: ReturnType<typeof useTranslations<"common">>;
  formatDate: (d: string) => string;
}) {
  const dp = user.diver_profile;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-300 dark:text-slate-400">
          {t("userInfo")}
        </h3>
        <dl className="space-y-1 text-sm">
          <DlItem label={t("id")} value={user.id} mono />
          <DlItem label={t("username")} value={user.username ?? ""} />
          <DlItem label={t("email")} value={user.email ?? ""} />
          <DlItem
            label={t("emailVerified")}
            value={user.email_verified ? tCommon("yes") : tCommon("no")}
            color={
              user.email_verified
                ? "text-emerald-400 dark:text-emerald-400"
                : "text-red-400 dark:text-red-400"
            }
          />
          {user.phone && <DlItem label={t("phone")} value={user.phone ?? ""} />}
          {user.preferred_locale && (
            <DlItem
              label={t("preferredLanguage")}
              value={user.preferred_locale ?? ""}
            />
          )}
        </dl>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-300 dark:text-slate-400">
          {t("certification")}
        </h3>
        <dl className="space-y-1 text-sm">
          {dp?.certification_level !== null && dp?.certification_level !== undefined ? (
            <DlItem
              label={t("certificationLevel")}
              value={String(dp.certification_level ?? "")}
            />
          ) : (
            <div className="text-slate-500 dark:text-slate-500">
              {t("noCertification")}
            </div>
          )}
          {dp?.certification_org !== null && dp?.certification_org !== undefined ? (
            <DlItem
              label={t("certificationOrg")}
              value={String(dp.certification_org)}
            />
          ) : null}
          <DlItem
            label={t("totalDives")}
            value={String(dp?.total_dives ?? 0)}
          />
        </dl>
      </div>
      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-300 dark:text-slate-400">
          {t("accountStatus")}
        </h3>
        <dl className="space-y-1 text-sm">
          <div>
            <dt className="text-slate-500 dark:text-slate-500">
              {t("status")}
            </dt>
            <dd>
              <StatusBadge status={user.status ?? ""} />
            </dd>
          </div>
          <div>
            <dt className="text-slate-500 dark:text-slate-500">
              {t("roles")}
            </dt>
            <dd>
              <div className="mt-1 flex flex-wrap gap-1">
                <RoleBadge role={user.role === "admin_diver" || user.admin === true ? "admin" : "diver"} />
              </div>
            </dd>
          </div>
          <DlItem label={t("createdAt")} value={formatDate(user.created_at ?? "")} />
        </dl>
      </div>
    </div>
  );
}

// ─── Description list item ───────────────────────────────────────────────────

function DlItem({
  label,
  value,
  mono,
  color,
}: {
  label: string;
  value: string;
  mono?: boolean;
  color?: string;
}) {
  return (
    <div>
      <dt className="text-slate-500 dark:text-slate-500">{label}</dt>
      <dd
        className={`${mono ? "font-mono text-xs" : ""} ${color ?? "text-slate-300 dark:text-slate-300"}`}
      >
        {value}
      </dd>
    </div>
  );
}
