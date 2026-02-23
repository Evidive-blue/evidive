"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  centerApi,
  type CenterMember,
  type AddMemberRequest,
} from "@/lib/api";
import { Plus, Trash2, X, Users, Shield, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { PageSkeleton } from "@/components/admin/loading-skeleton";
import { StatusBadge } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConfirmDialog, ConfirmDialog } from "@/components/admin/confirm-dialog";

function memberDisplayName(m: CenterMember): string {
  const name = [m.profile_first_name, m.profile_last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || m.profile_email || m.fk_profile;
}

function roleIcon(role: string) {
  switch (role) {
    case "owner":
      return <ShieldCheck className="h-4 w-4 text-amber-400" />;
    case "manager":
      return <Shield className="h-4 w-4 text-cyan-400" />;
    default:
      return <Users className="h-4 w-4 text-slate-400" />;
  }
}

interface AddMemberForm {
  email: string;
  role_in_center: string;
}

type ViewMode = "list" | "add";

export function DashboardMembersClient() {
  const t = useTranslations("dashboard");
  const [members, setMembers] = useState<CenterMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("list");
  const confirmDialog = useConfirmDialog();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await centerApi.getMembers();
      setMembers(data);
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRemove = (member: CenterMember) => {
    if (member.role_in_center === "owner") {
      toast.error(t("cannotRemoveOwner"));
      return;
    }
    confirmDialog.confirm({
      title: t("confirmDelete"),
      description: t("confirmRemoveMember"),
      onConfirm: async () => {
        try {
          await centerApi.removeMember(member.id);
          toast.success(t("memberRemoved"));
          setMembers((prev) => prev.filter((m) => m.id !== member.id));
        } catch {
          toast.error(t("saveError"));
        }
      },
    });
  };

  const handleChangeRole = async (member: CenterMember, newRole: string) => {
    try {
      await centerApi.updateMemberRole(member.id, { role_in_center: newRole });
      toast.success(t("memberRoleUpdated"));
      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, role_in_center: newRole } : m))
      );
    } catch {
      toast.error(t("saveError"));
    }
  };

  const handleSaved = () => {
    setView("list");
    load();
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (view === "add") {
    return (
      <AddMemberPanel onCancel={() => setView("list")} onSaved={handleSaved} />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader titleKey="members" namespace="dashboard">
        <Button
          onClick={() => setView("add")}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <Plus className="h-4 w-4" />
          {t("addMember")}
        </Button>
      </PageHeader>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={confirmDialog.onOpenChange}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        onConfirm={confirmDialog.onConfirm}
      />

      {members.length === 0 ? (
        <EmptyState icon={Users} title={t("noMembers")} />
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                {roleIcon(member.role_in_center)}
                <div>
                  <p className="font-medium text-slate-100">
                    {memberDisplayName(member)}
                  </p>
                  {member.profile_email && (
                    <p className="text-sm text-slate-400">{member.profile_email}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {member.role_in_center === "owner" ? (
                  <StatusBadge status="active" label={t("roleOwner")} />
                ) : (
                  <select
                    value={member.role_in_center}
                    onChange={(e) => handleChangeRole(member, e.target.value)}
                    className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200 focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                  >
                    <option value="employee">{t("roleEmployee")}</option>
                    <option value="manager">{t("roleMemberManager")}</option>
                  </select>
                )}

                {member.role_in_center !== "owner" && (
                  <Button
                    onClick={() => handleRemove(member)}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddMemberPanel({
  onCancel,
  onSaved,
}: {
  onCancel: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("dashboard");
  const [saving, setSaving] = useState(false);

  const schema = z.object({
    email: z.string().min(1, t("required")).email(t("invalidEmail")),
    role_in_center: z.string().min(1, t("required")),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddMemberForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      role_in_center: "employee",
    },
  });

  const onSubmit = async (data: AddMemberForm) => {
    setSaving(true);
    try {
      const body: AddMemberRequest = {
        email: data.email,
        role_in_center: data.role_in_center,
      };
      await centerApi.addMember(body);
      toast.success(t("memberAdded"));
      onSaved();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : t("saveError");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-100">
          {t("addMember")}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
          aria-label={t("cancel")}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <p className="text-sm text-slate-400">{t("addMemberDescription")}</p>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">
            {t("memberEmail")}
          </label>
          <Input
            {...register("email")}
            type="email"
            className="bg-slate-800 border-slate-700 text-white"
            placeholder={t("memberEmailPlaceholder")}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">
            {t("memberRole")}
          </label>
          <select
            {...register("role_in_center")}
            className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          >
            <option value="employee">{t("roleEmployee")}</option>
            <option value="manager">{t("roleMemberManager")}</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={saving}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {saving ? "..." : t("addMember")}
          </Button>
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            className="border-slate-700 bg-slate-800 text-slate-300"
          >
            {t("cancel")}
          </Button>
        </div>
      </form>
    </div>
  );
}
