"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  centerApi,
  publicApi,
  type PublicService,
  type ServiceResponse,
  type CreateServiceRequest,
  type UpdateServiceRequest,
} from "@/lib/api";
import { Plus, Pencil, Trash2, X, Briefcase } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { PageSkeleton } from "@/components/admin/loading-skeleton";
import { StatusBadge } from "@/components/admin/status-badge";
import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useConfirmDialog, ConfirmDialog } from "@/components/admin/confirm-dialog";

type ServiceForm = {
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
  capacity?: number;
  category_id: string;
};

type ViewMode = "list" | "create" | "edit";

export function DashboardServicesClient() {
  const t = useTranslations("dashboard");
  const format = useFormatter();
  
  const [services, setServices] = useState<PublicService[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const confirmDialog = useConfirmDialog();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [svc, cats] = await Promise.all([
        centerApi.getServices(),
        publicApi.getCategories(),
      ]);
      setServices(svc);
      setCategories(cats.map((c) => ({ id: c.code, name: c.name_en || c.name_fr })));
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    confirmDialog.confirm({
      title: t("confirmDelete"),
      description: t("confirmDeleteService"),
      onConfirm: async () => {
        try {
          await centerApi.deleteService(id);
          toast.success(t("serviceDeleted"));
          setServices((prev) => prev.filter((s) => s.id !== id));
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

  if (loading) {
    return <PageSkeleton />;
  }

  if (view === "create") {
    return (
      <ServiceFormPanel
        categories={categories}
        onCancel={() => setView("list")}
        onSaved={handleSaved}
      />
    );
  }

  if (view === "edit" && editingId) {
    const svc = services.find((s) => s.id === editingId);
    return (
      <ServiceFormPanel
        categories={categories}
        existing={svc}
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
        titleKey="services"
        namespace="dashboard"
      >
        <Button
          onClick={() => setView("create")}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <Plus className="h-4 w-4" />
          {t("addService")}
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

      {services.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={t("noServices")}
        />
      ) : (
        <div className="space-y-3">
          {services.map((svc) => (
            <div
              key={svc.id}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{svc.name}</span>
                  <StatusBadge
                    status={svc.is_active ? "active" : "inactive"}
                    label={svc.is_active ? t("serviceActive") : t("inactive")}
                  />
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  {format.number(parseFloat(String(svc.price)) || 0, { style: "currency", currency: "EUR" })} &middot; {svc.duration_minutes}{" "}
                  min
                  {(svc.capacity ?? svc.max_capacity) && ` · ${t("serviceCapacity")}: ${svc.capacity ?? svc.max_capacity}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleEdit(svc.id)}
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:bg-slate-800 hover:text-white"
                  aria-label={t("editService")}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => handleDelete(svc.id)}
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                  aria-label={t("deleteService")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceFormPanel({
  categories,
  existing,
  onCancel,
  onSaved,
}: {
  categories: { id: string; name: string }[];
  existing?: PublicService;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const [saving, setSaving] = useState(false);

  const serviceSchema = z.object({
    name: z.string().min(1, t("required")),
    description: z.string().optional(),
    price: z.number().min(0),
    duration_minutes: z.number().min(1),
    capacity: z.number().min(1).optional(),
    category_id: z.string().min(1, t("required")),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceForm>({
    resolver: zodResolver(serviceSchema),
    defaultValues: existing
      ? {
          name: existing.name,
          description: existing.description ?? "",
          price: parseFloat(String(existing.price)) || 0,
          duration_minutes: existing.duration_minutes,
          capacity: (existing as ServiceResponse & { capacity?: number }).capacity ?? existing.max_capacity ?? undefined,
          category_id: typeof existing.category === "string" ? existing.category : (existing.category as { id?: string } | null)?.id ?? "",
        }
      : {
          price: 0,
          duration_minutes: 60,
        },
  });

  const onSubmit = async (data: ServiceForm) => {
    setSaving(true);
    try {
      if (existing) {
        const body: UpdateServiceRequest = {
          name: data.name,
          description: data.description,
          price: data.price,
          duration_minutes: data.duration_minutes,
          max_capacity: data.capacity,
        };
        await centerApi.updateService(existing.id, body);
        toast.success(t("serviceUpdated"));
      } else {
        const body: CreateServiceRequest = {
          category_id: data.category_id,
          category: data.category_id,
          name: data.name,
          description: data.description,
          price: data.price,
          duration_minutes: data.duration_minutes,
          max_capacity: data.capacity,
        };
        await centerApi.createService(body);
        toast.success(t("serviceCreated"));
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
      <PageHeader
        titleKey={existing ? "editService" : "addService"}
        namespace="dashboard"
      >
        <Button
          onClick={onCancel}
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:bg-slate-800 hover:text-white"
          aria-label={tCommon("cancel")}
        >
          <X className="h-5 w-5" />
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label={t("serviceName")} error={errors.name?.message}>
          <Input
            {...register("name")}
            className="bg-slate-800 border-slate-700 text-white placeholder-slate-500"
          />
        </Field>

        <Field label={t("serviceDescription")}>
          <textarea
            {...register("description")}
            rows={3}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("servicePrice")} error={errors.price?.message}>
            <Input
              {...register("price", { valueAsNumber: true })}
              type="number"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </Field>
          <Field label={t("serviceDuration")} error={errors.duration_minutes?.message}>
            <Input
              {...register("duration_minutes", { valueAsNumber: true })}
              type="number"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("serviceCapacity")}>
            <Input
              {...register("capacity", { valueAsNumber: true })}
              type="number"
              className="bg-slate-800 border-slate-700 text-white"
            />
          </Field>
          <Field label={t("serviceCategory")} error={errors.category_id?.message}>
            <select
              {...register("category_id")}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              <option value="">--</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={saving}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {saving ? "..." : existing ? t("editService") : t("addService")}
          </Button>
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            className="border-slate-700 bg-slate-800 text-slate-300"
          >
            {tCommon("cancel")}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}
