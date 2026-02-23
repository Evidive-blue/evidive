"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  centerApi,
  type StaffMember,
  type CreateStaffRequest,
  type UpdateStaffMemberRequest,
} from "@/lib/api";
import { Plus, Pencil, Trash2, X, UserCircle } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { PageSkeleton } from "@/components/admin/loading-skeleton";
import { StatusBadge } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConfirmDialog, ConfirmDialog } from "@/components/admin/confirm-dialog";

function staffDisplayName(s: StaffMember): string {
  return `${s.first_name} ${s.last_name}`.trim() || s.email || s.id;
}

interface StaffForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role_label: string;
}

type ViewMode = "list" | "create" | "edit";

export function DashboardTeamClient() {
  const t = useTranslations("dashboard");
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBioId, setEditingBioId] = useState<string | null>(null);
  const [bioValue, setBioValue] = useState("");
  const [savingBio, setSavingBio] = useState(false);
  const confirmDialog = useConfirmDialog();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await centerApi.getStaff();
      setStaff(data);
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = (id: string) => {
    confirmDialog.confirm({
      title: t("confirmDelete"),
      description: t("confirmDeleteStaff"),
      onConfirm: async () => {
        try {
          await centerApi.removeStaff(id);
          toast.success(t("staffDeleted"));
          setStaff((prev) => prev.filter((s) => s.id !== id));
        } catch {
          toast.error(t("saveError"));
        }
      },
    });
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setView("edit");
  };

  const handleSaved = () => {
    setView("list");
    setEditingId(null);
    load();
  };

  const handleEditBio = (member: StaffMember) => {
    setEditingBioId(member.id);
    setBioValue(member.bio ?? "");
  };

  const handleSaveBio = async (staffId: string) => {
    setSavingBio(true);
    try {
      await centerApi.updateStaffBio(staffId, bioValue);
      toast.success(t("bioUpdated"));
      setStaff((prev) =>
        prev.map((s) => (s.id === staffId ? { ...s, bio: bioValue } : s))
      );
      setEditingBioId(null);
    } catch {
      toast.error(t("saveError"));
    } finally {
      setSavingBio(false);
    }
  };

  const handleCancelEditBio = () => {
    setEditingBioId(null);
    setBioValue("");
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (view === "create") {
    return (
      <StaffFormPanel onCancel={() => setView("list")} onSaved={handleSaved} />
    );
  }

  if (view === "edit" && editingId) {
    const member = staff.find((s) => s.id === editingId);
    return (
      <StaffFormPanel
        existing={member}
        onCancel={() => {
          setView("list");
          setEditingId(null);
        }}
        onSaved={handleSaved}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="team"
        namespace="dashboard"
      >
        <Button
          onClick={() => setView("create")}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <Plus className="h-4 w-4" />
          {t("addWorker")}
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

      {staff.length === 0 ? (
        <EmptyState
          icon={UserCircle}
          title={t("noStaff")}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((member) => {
            const isEditingBio = editingBioId === member.id;
            return (
              <div
                key={member.id}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <UserCircle className="h-10 w-10 text-slate-600" />
                    <div>
                      <p className="font-medium text-slate-100">{staffDisplayName(member)}</p>
                      {member.email && (
                        <p className="text-sm text-slate-400">{member.email}</p>
                      )}
                      {member.phone && (
                        <p className="text-xs text-slate-500">{member.phone}</p>
                      )}
                      <p className="mt-0.5 text-xs text-cyan-400/70">{member.role_label}</p>
                    </div>
                  </div>
                  <StatusBadge
                    status={member.is_active ? "active" : "inactive"}
                    label={member.is_active ? t("workerActive") : t("inactive")}
                  />
                </div>
                <div className="mt-3 border-t border-slate-800 pt-3">
                  {isEditingBio ? (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-400">{t("workerBio")}</label>
                      <textarea
                        value={bioValue}
                        onChange={(e) => setBioValue(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                        placeholder={t("workerBio")}
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={() => handleSaveBio(member.id)}
                          disabled={savingBio}
                          size="sm"
                          className="bg-cyan-600 hover:bg-cyan-700 text-white"
                        >
                          {savingBio ? "..." : t("saveBio")}
                        </Button>
                        <Button
                          type="button"
                          onClick={handleCancelEditBio}
                          variant="outline"
                          size="sm"
                          className="border-slate-700 bg-slate-800 text-slate-300"
                        >
                          {t("cancel")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {member.bio ? (
                        <p className="text-sm text-slate-300">{member.bio}</p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          onClick={() => handleEdit(member.id)}
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          {t("editStaff")}
                        </Button>
                        <Button
                          onClick={() => handleEditBio(member)}
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          {t("editBio")}
                        </Button>
                        <Button
                          onClick={() => handleDelete(member.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {t("deleteStaff")}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StaffFormPanel({
  existing,
  onCancel,
  onSaved,
}: {
  existing?: StaffMember;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("dashboard");
  const [saving, setSaving] = useState(false);

  const staffSchema = z.object({
    first_name: z.string().min(1, t("required")),
    last_name: z.string().min(1, t("required")),
    email: z.string().email(t("invalidEmail")).or(z.literal("")),
    phone: z.string(),
    role_label: z.string().min(1, t("required")),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StaffForm>({
    resolver: zodResolver(staffSchema),
    defaultValues: existing
      ? {
          first_name: existing.first_name,
          last_name: existing.last_name,
          email: existing.email ?? "",
          phone: existing.phone ?? "",
          role_label: existing.role_label,
        }
      : {
          first_name: "",
          last_name: "",
          email: "",
          phone: "",
          role_label: "instructor",
        },
  });

  const onSubmit = async (data: StaffForm) => {
    setSaving(true);
    try {
      if (existing) {
        const body: UpdateStaffMemberRequest = {
          first_name: data.first_name || undefined,
          last_name: data.last_name || undefined,
          email: data.email || undefined,
          phone: data.phone || undefined,
          role_label: data.role_label || undefined,
        };
        await centerApi.updateStaffMember(existing.id, body);
        toast.success(t("staffUpdated"));
      } else {
        const body: CreateStaffRequest = {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email || undefined,
          phone: data.phone || undefined,
          role_label: data.role_label || undefined,
        };
        await centerApi.addStaff(body);
        toast.success(t("staffCreated"));
      }
      onSaved();
    } catch {
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-100">
          {existing ? t("editStaff") : t("addStaff")}
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

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              {t("firstName")}
            </label>
            <Input
              {...register("first_name")}
              className="bg-slate-800 border-slate-700 text-white"
              placeholder={t("firstName")}
            />
            {errors.first_name && (
              <p className="mt-1 text-xs text-red-400">{errors.first_name.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">
              {t("lastName")}
            </label>
            <Input
              {...register("last_name")}
              className="bg-slate-800 border-slate-700 text-white"
              placeholder={t("lastName")}
            />
            {errors.last_name && (
              <p className="mt-1 text-xs text-red-400">{errors.last_name.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">
            {t("workerEmail")}
          </label>
          <Input
            {...register("email")}
            type="email"
            className="bg-slate-800 border-slate-700 text-white"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">
            {t("workerPhone")}
          </label>
          <Input
            {...register("phone")}
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">
            {t("staffRole")}
          </label>
          <select
            {...register("role_label")}
            className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          >
            <option value="instructor">{t("roleInstructor")}</option>
            <option value="divemaster">{t("roleDivemaster")}</option>
            <option value="receptionist">{t("roleReceptionist")}</option>
            <option value="manager">{t("roleManager")}</option>
            <option value="guide">{t("roleGuide")}</option>
          </select>
          {errors.role_label && (
            <p className="mt-1 text-xs text-red-400">{errors.role_label.message}</p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={saving}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {saving ? "..." : existing ? t("editStaff") : t("addStaff")}
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
