"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  MoreVertical,
  Pencil,
  Copy,
  Archive,
  Power,
  Trash2,
  Clock,
  Users,
  Award,
  Loader2,
  Package,
} from "lucide-react";

type LocalizedJson = Record<string, unknown>;

interface ServiceCardProps {
  service: {
    id: string;
    name: LocalizedJson;
    description?: LocalizedJson;
    price: number;
    currency: string;
    durationMinutes: number;
    minParticipants: number;
    maxParticipants: number;
    minCertification?: string | null;
    equipmentIncluded: boolean;
    isActive: boolean;
    category?: {
      id: string;
      slug: string;
      name: LocalizedJson;
    } | null;
    _count?: {
      extras: number;
    };
  };
  locale: string;
  basePath?: string;
  translations: {
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
  certificationsTranslations: Record<string, string>;
  onArchive: (id: string) => Promise<void>;
  onActivate: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDuplicate: (id: string) => Promise<void>;
}

export function ServiceCard({
  service,
  locale,
  basePath,
  translations: t,
  certificationsTranslations,
  onArchive,
  onActivate,
  onDelete,
  onDuplicate,
}: ServiceCardProps) {
  const servicesBasePath = basePath || `/${locale}/center`;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h${mins}`;
  };

  const handleArchive = () => {
    startTransition(async () => {
      await onArchive(service.id);
      setShowArchiveDialog(false);
    });
  };

  const handleActivate = () => {
    startTransition(async () => {
      await onActivate(service.id);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await onDelete(service.id);
      setShowDeleteDialog(false);
    });
  };

  const handleDuplicate = () => {
    startTransition(async () => {
      await onDuplicate(service.id);
    });
  };

  const serviceName = getLocalizedText(service.name);
  const categoryName = service.category ? getLocalizedText(service.category.name) : null;

  return (
    <>
      <Card
        className={cn(
          "border-white/10 bg-white/5 backdrop-blur-xl transition-all hover:border-white/20",
          !service.isActive && "opacity-60"
        )}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              {/* Category badge */}
              {categoryName && (
                <Badge
                  variant="outline"
                  className="mb-2 border-cyan-500/30 bg-cyan-500/10 text-cyan-200"
                >
                  {categoryName}
                </Badge>
              )}

              {/* Service name */}
              <h3 className="truncate text-lg font-semibold text-white">
                {serviceName}
              </h3>

              {/* Price */}
              <p className="mt-1 text-2xl font-bold text-emerald-400">
                {formatPrice(service.price, service.currency)}
              </p>

              {/* Info badges */}
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge
                  variant="secondary"
                  className="bg-white/10 text-white/80"
                >
                  <Clock className="mr-1 h-3 w-3" />
                  {formatDuration(service.durationMinutes)}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-white/10 text-white/80"
                >
                  <Users className="mr-1 h-3 w-3" />
                  {service.minParticipants}-{service.maxParticipants}
                </Badge>
                {service.minCertification && (
                  <Badge
                    variant="secondary"
                    className="bg-amber-500/20 text-amber-200"
                  >
                    <Award className="mr-1 h-3 w-3" />
                    {certificationsTranslations[service.minCertification] ||
                      service.minCertification}
                  </Badge>
                )}
                {service._count && service._count.extras > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-orange-500/20 text-orange-200"
                  >
                    <Package className="mr-1 h-3 w-3" />
                    {service._count.extras} {t.extras}
                  </Badge>
                )}
              </div>

              {/* Status */}
              <div className="mt-3">
                {service.isActive ? (
                  <Badge className="bg-emerald-500/20 text-emerald-300">
                    {t.active}
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-500/20 text-yellow-300">
                    {t.archived}
                  </Badge>
                )}
                {service.equipmentIncluded && (
                  <Badge className="ml-2 bg-blue-500/20 text-blue-300">
                    {t.equipmentIncluded}
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white/60 hover:bg-white/10 hover:text-white"
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoreVertical className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`${servicesBasePath}/services/${service.id}/edit`)
                  }
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  {t.edit}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="mr-2 h-4 w-4" />
                  {t.duplicate}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {service.isActive ? (
                  <DropdownMenuItem onClick={() => setShowArchiveDialog(true)}>
                    <Archive className="mr-2 h-4 w-4" />
                    {t.archive}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={handleActivate}>
                    <Power className="mr-2 h-4 w-4" />
                    {t.activate}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-400 focus:text-red-400"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t.delete}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Archive Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmArchiveTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.confirmArchiveDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t.archive}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmDeleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.confirmDeleteDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
