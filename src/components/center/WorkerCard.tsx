"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
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
  Power,
  PowerOff,
  Trash2,
  Mail,
  Phone,
  Award,
  Languages,
  Loader2,
  Crown,
  User,
} from "lucide-react";

export interface Worker {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
  bio: string | null;
  certifications: string[];
  languages: string[];
  isDefault: boolean;
  isActive: boolean;
  _count?: {
    bookings: number;
  };
}

interface WorkerCardTranslations {
  edit: string;
  deactivate: string;
  reactivate: string;
  delete: string;
  owner: string;
  active: string;
  inactive: string;
  noCertifications: string;
  noLanguages: string;
  confirmDeactivateTitle: string;
  confirmDeactivateDescription: string;
  confirmDeleteTitle: string;
  confirmDeleteDescription: string;
  cannotDeleteWithBookings: string;
  cancel: string;
}

interface WorkerCardProps {
  worker: Worker;
  translations: WorkerCardTranslations;
  certificationsMap: Record<string, string>;
  languagesMap: Record<string, string>;
  onEdit: (worker: Worker) => void;
  onDeactivate: (id: string) => Promise<{ success: boolean; error?: string }>;
  onReactivate: (id: string) => Promise<{ success: boolean; error?: string }>;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export function WorkerCard({
  worker,
  translations: t,
  certificationsMap,
  languagesMap,
  onEdit,
  onDeactivate,
  onReactivate,
  onDelete,
}: WorkerCardProps) {
  const [isPending, startTransition] = useTransition();
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasBookings = (worker._count?.bookings || 0) > 0;

  const handleDeactivate = () => {
    setError(null);
    startTransition(async () => {
      const result = await onDeactivate(worker.id);
      if (!result.success) {
        setError(result.error || "Erreur");
      }
      setShowDeactivateDialog(false);
    });
  };

  const handleReactivate = () => {
    setError(null);
    startTransition(async () => {
      const result = await onReactivate(worker.id);
      if (!result.success) {
        setError(result.error || "Erreur");
      }
    });
  };

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await onDelete(worker.id);
      if (!result.success) {
        setError(result.error || "Erreur");
      }
      setShowDeleteDialog(false);
    });
  };

  return (
    <>
      <Card
        className={cn(
          "border-white/10 bg-white/5 backdrop-blur-xl transition-all hover:border-white/20",
          !worker.isActive && "opacity-60"
        )}
      >
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 border-white/10">
              {worker.photoUrl ? (
                <Image
                  src={worker.photoUrl}
                  alt={worker.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                  <User className="h-8 w-8 text-white/40" />
                </div>
              )}
              {worker.isDefault && (
                <div className="absolute -right-1 -top-1 rounded-full bg-amber-500 p-1">
                  <Crown className="h-3 w-3 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
                    {worker.name}
                    {worker.isDefault && (
                      <Badge className="bg-amber-500/20 text-amber-300">
                        {t.owner}
                      </Badge>
                    )}
                  </h3>

                  {/* Contact info */}
                  <div className="mt-1 space-y-0.5">
                    {worker.email && (
                      <p className="flex items-center gap-1.5 text-sm text-white/60">
                        <Mail className="h-3.5 w-3.5" />
                        {worker.email}
                      </p>
                    )}
                    {worker.phone && (
                      <p className="flex items-center gap-1.5 text-sm text-white/60">
                        <Phone className="h-3.5 w-3.5" />
                        {worker.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions dropdown - only show if not owner */}
                {!worker.isDefault && (
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
                      <DropdownMenuItem onClick={() => onEdit(worker)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        {t.edit}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {worker.isActive ? (
                        <DropdownMenuItem
                          onClick={() => setShowDeactivateDialog(true)}
                        >
                          <PowerOff className="mr-2 h-4 w-4" />
                          {t.deactivate}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={handleReactivate}>
                          <Power className="mr-2 h-4 w-4" />
                          {t.reactivate}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-red-400 focus:text-red-400"
                        disabled={hasBookings}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t.delete}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Bio */}
              {worker.bio && (
                <p className="mt-2 line-clamp-2 text-sm text-white/70">
                  {worker.bio}
                </p>
              )}

              {/* Certifications */}
              {worker.certifications.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Award className="mr-1 h-4 w-4 text-amber-400" />
                  {worker.certifications.map((cert) => (
                    <Badge
                      key={cert}
                      variant="secondary"
                      className="bg-amber-500/20 text-amber-200"
                    >
                      {certificationsMap[cert] || cert}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Languages */}
              {worker.languages.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Languages className="mr-1 h-4 w-4 text-cyan-400" />
                  {worker.languages.map((lang) => (
                    <Badge
                      key={lang}
                      variant="secondary"
                      className="bg-cyan-500/20 text-cyan-200"
                    >
                      {languagesMap[lang] || lang}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Status */}
              <div className="mt-3">
                {worker.isActive ? (
                  <Badge className="bg-emerald-500/20 text-emerald-300">
                    {t.active}
                  </Badge>
                ) : (
                  <Badge className="bg-yellow-500/20 text-yellow-300">
                    {t.inactive}
                  </Badge>
                )}
              </div>

              {/* Error message */}
              {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deactivate Dialog */}
      <AlertDialog
        open={showDeactivateDialog}
        onOpenChange={setShowDeactivateDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmDeactivateTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.confirmDeactivateDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {t.deactivate}
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
              {hasBookings
                ? t.cannotDeleteWithBookings
                : t.confirmDeleteDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            {!hasBookings && (
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
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
