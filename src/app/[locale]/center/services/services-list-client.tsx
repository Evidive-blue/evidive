"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ServiceCard } from "@/components/center/services/ServiceCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Package, Plus, Filter } from "lucide-react";
import {
  archiveService,
  activateService,
  deleteService,
  duplicateService,
} from "./actions";

type LocalizedJson = Record<string, unknown>;

interface Service {
  id: string;
  name: LocalizedJson;
  description?: LocalizedJson;
  price: number;
  currency: string;
  durationMinutes: number;
  minParticipants: number;
  maxParticipants: number;
  minCertification: string | null;
  equipmentIncluded: boolean;
  isActive: boolean;
  category: {
    id: string;
    slug: string;
    name: LocalizedJson;
  } | null;
  _count: {
    extras: number;
  };
}

interface Category {
  id: string;
  slug: string;
  name: LocalizedJson;
}

interface Translations {
  title: string;
  subtitle: string;
  newService: string;
  backToCenter: string;
  filters: {
    all: string;
    active: string;
    archived: string;
  };
  empty: {
    title: string;
    description: string;
    cta: string;
  };
  card: {
    edit: string;
    duplicate: string;
    archive: string;
    activate: string;
    delete: string;
    price: string;
    duration: string;
    participants: string;
    certification: string;
    extras: string;
    active: string;
    archived: string;
    equipmentIncluded: string;
    confirmArchiveTitle: string;
    confirmArchiveDescription: string;
    confirmDeleteTitle: string;
    confirmDeleteDescription: string;
    cancel: string;
  };
  certifications: Record<string, string>;
}

interface ServicesListClientProps {
  services: Service[];
  categories: Category[];
  locale: string;
  translations: Translations;
}

type StatusFilter = "all" | "active" | "archived";

export function ServicesListClient({
  services,
  categories,
  locale,
  translations: t,
}: ServicesListClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const getLocalizedText = (value: unknown): string => {
    if (!value || typeof value !== "object") return "";
    const obj = value as LocalizedJson;
    const direct = obj[locale];
    if (typeof direct === "string" && direct.trim()) return direct;
    const fr = obj.fr;
    if (typeof fr === "string" && fr.trim()) return fr;
    const en = obj.en;
    if (typeof en === "string" && en.trim()) return en;
    for (const key of Object.keys(obj)) {
      const v = obj[key];
      if (typeof v === "string" && v.trim()) return v;
    }
    return "";
  };

  // Filter services
  const filteredServices = services.filter((service) => {
    // Status filter
    if (statusFilter === "active" && !service.isActive) return false;
    if (statusFilter === "archived" && service.isActive) return false;

    // Category filter
    if (categoryFilter !== "all" && service.category?.id !== categoryFilter) {
      return false;
    }

    return true;
  });

  const handleArchive = async (id: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("id", id);
      await archiveService(formData);
      router.refresh();
    });
  };

  const handleActivate = async (id: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("id", id);
      await activateService(formData);
      router.refresh();
    });
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("id", id);
      await deleteService(formData);
      router.refresh();
    });
  };

  const handleDuplicate = async (id: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("id", id);
      const result = await duplicateService(formData);
      if (result.success && result.serviceId) {
        router.push(`/${locale}/center/services/${result.serviceId}/edit`);
      } else {
        router.refresh();
      }
    });
  };

  // Count stats
  const activeCount = services.filter((s) => s.isActive).length;
  const archivedCount = services.filter((s) => !s.isActive).length;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-white/60">
          <Filter className="h-4 w-4" />
          <span className="text-sm">Filtrer :</span>
        </div>

        {/* Status filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              statusFilter === "all"
                ? "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-500/50"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            )}
          >
            {t.filters.all} ({services.length})
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              statusFilter === "active"
                ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-500/50"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            )}
          >
            {t.filters.active} ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter("archived")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              statusFilter === "archived"
                ? "bg-yellow-500/20 text-yellow-200 ring-1 ring-yellow-500/50"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
            )}
          >
            {t.filters.archived} ({archivedCount})
          </button>
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] border-white/10 bg-white/5 text-white">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {getLocalizedText(cat.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Services Grid or Empty State */}
      {filteredServices.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
          <Package className="mx-auto h-16 w-16 text-white/20" />
          <h3 className="mt-4 text-xl font-semibold text-white">
            {t.empty.title}
          </h3>
          <p className="mt-2 text-white/60">{t.empty.description}</p>
          <Button
            onClick={() => router.push(`/${locale}/center/services/new`)}
            className="mt-6 bg-cyan-600 text-white hover:bg-cyan-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t.empty.cta}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              locale={locale}
              translations={t.card}
              certificationsTranslations={t.certifications}
              onArchive={handleArchive}
              onActivate={handleActivate}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
