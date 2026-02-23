"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  adminApi,
  type LocationResponse,
  type CreateLocationRequest,
} from "@/lib/api";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import { TableSkeleton } from "@/components/admin/loading-skeleton";
import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ConfirmDialog,
  useConfirmDialog,
} from "@/components/admin/confirm-dialog";

export function AdminLocationsClient(): React.JSX.Element {
  const t = useTranslations("admin");
  const confirmDialog = useConfirmDialog();
  const [locations, setLocations] = useState<LocationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [newRegion, setNewRegion] = useState("");
  const [newDifficulty, setNewDifficulty] = useState("");
  const [newDepthMax, setNewDepthMax] = useState("");
  const [newLatitude, setNewLatitude] = useState("");
  const [newLongitude, setNewLongitude] = useState("");

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [editRegion, setEditRegion] = useState("");
  const [editDifficulty, setEditDifficulty] = useState("");
  const [editDepthMax, setEditDepthMax] = useState("");
  const [editLatitude, setEditLatitude] = useState("");
  const [editLongitude, setEditLongitude] = useState("");

  const loadLocations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getLocations();
      setLocations(data);
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const resetAddForm = (): void => {
    setNewName("");
    setNewDescription("");
    setNewCountry("");
    setNewRegion("");
    setNewDifficulty("");
    setNewDepthMax("");
    setNewLatitude("");
    setNewLongitude("");
  };

  const parseOptionalNumber = (val: string): number | undefined => {
    const n = parseFloat(val);
    return isNaN(n) ? undefined : n;
  };

  const parseOptionalInt = (val: string): number | undefined => {
    const n = parseInt(val, 10);
    return isNaN(n) ? undefined : n;
  };

  const handleCreate = async (): Promise<void> => {
    if (!newName.trim()) {
      toast.error(t("nameRequired"));
      return;
    }
    try {
      const body: CreateLocationRequest = {
        name: newName,
        description: newDescription || undefined,
        country: newCountry || undefined,
        region: newRegion || undefined,
        difficulty: newDifficulty || undefined,
        depth_max: parseOptionalInt(newDepthMax),
        latitude: parseOptionalNumber(newLatitude),
        longitude: parseOptionalNumber(newLongitude),
      };
      await adminApi.createLocation(body);
      toast.success(t("locationCreated"));
      resetAddForm();
      setShowAddForm(false);
      loadLocations();
    } catch {
      toast.error(t("saveError"));
    }
  };

  const handleStartEdit = (loc: LocationResponse): void => {
    setEditingId(loc.id);
    setEditName(loc.name);
    setEditDescription(loc.description ?? "");
    setEditCountry(loc.country ?? "");
    setEditRegion(loc.region ?? "");
    setEditDifficulty(loc.difficulty ?? "");
    setEditDepthMax(loc.depth_max != null ? String(loc.depth_max) : "");
    setEditLatitude(loc.latitude != null ? String(loc.latitude) : "");
    setEditLongitude(loc.longitude != null ? String(loc.longitude) : "");
  };

  const handleCancelEdit = (): void => {
    setEditingId(null);
  };

  const handleUpdate = async (id: string): Promise<void> => {
    if (!editName.trim()) {
      toast.error(t("nameRequired"));
      return;
    }
    try {
      const body: Partial<CreateLocationRequest> = {
        name: editName,
        description: editDescription || undefined,
        country: editCountry || undefined,
        region: editRegion || undefined,
        difficulty: editDifficulty || undefined,
        depth_max: parseOptionalInt(editDepthMax),
        latitude: parseOptionalNumber(editLatitude),
        longitude: parseOptionalNumber(editLongitude),
      };
      await adminApi.updateLocation(id, body);
      toast.success(t("locationUpdated"));
      setEditingId(null);
      loadLocations();
    } catch {
      toast.error(t("saveError"));
    }
  };

  const handleDelete = (id: string, name: string): void => {
    confirmDialog.confirm({
      title: t("confirmDelete"),
      description: t("confirmDeleteLocation") || `${name}`,
      onConfirm: async () => {
        try {
          await adminApi.deleteLocation(id);
          toast.success(t("locationDeleted"));
          loadLocations();
        } catch {
          toast.error(t("saveError"));
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={confirmDialog.onOpenChange}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        onConfirm={confirmDialog.onConfirm}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white dark:text-slate-100">
          {t("locations")}
        </h2>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-cyan-600 text-white hover:bg-cyan-700"
        >
          <Plus className="h-4 w-4" />
          {t("addLocation")}
        </Button>
      </div>

      {showAddForm && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm text-slate-400 dark:text-slate-300">
                {t("locationName")}
              </label>
              <Input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400 dark:text-slate-300">
                {t("description")}
              </label>
              <Input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400 dark:text-slate-300">
                {t("locationCountry")}
              </label>
              <Input
                type="text"
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400 dark:text-slate-300">
                {t("region")}
              </label>
              <Input
                type="text"
                value={newRegion}
                onChange={(e) => setNewRegion(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400 dark:text-slate-300">
                {t("difficulty")}
              </label>
              <Input
                type="text"
                value={newDifficulty}
                onChange={(e) => setNewDifficulty(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400 dark:text-slate-300">
                {t("depthMax")}
              </label>
              <Input
                type="number"
                value={newDepthMax}
                onChange={(e) => setNewDepthMax(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400 dark:text-slate-300">
                {t("latitude")}
              </label>
              <Input
                type="number"
                step="any"
                value={newLatitude}
                onChange={(e) => setNewLatitude(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-slate-400 dark:text-slate-300">
                {t("longitude")}
              </label>
              <Input
                type="number"
                step="any"
                value={newLongitude}
                onChange={(e) => setNewLongitude(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              onClick={handleCreate}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <Save className="h-4 w-4" />
              {t("save")}
            </Button>
            <Button
              onClick={() => {
                setShowAddForm(false);
                resetAddForm();
              }}
              variant="outline"
            >
              <X className="h-4 w-4" />
              {t("close")}
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : locations.length === 0 ? (
        <EmptyState title={t("noResults")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 dark:border-slate-700 dark:bg-slate-800">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 dark:border-slate-700">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("locationName")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("locationCountry")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("region")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("difficulty")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("depthMax")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 dark:divide-slate-700">
              {locations.map((loc) => (
                <tr
                  key={loc.id}
                  className="transition-colors hover:bg-slate-800/50"
                >
                  <td className="px-4 py-3">
                    {editingId === loc.id ? (
                      <Input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="min-w-[120px]"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => handleStartEdit(loc)}
                        className="text-left text-sm text-slate-300 hover:text-white"
                      >
                        {loc.name}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === loc.id ? (
                      <Input
                        type="text"
                        value={editCountry}
                        onChange={(e) => setEditCountry(e.target.value)}
                        className="min-w-[100px]"
                      />
                    ) : (
                      <span className="text-sm text-slate-400">
                        {loc.country ?? "\u2014"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === loc.id ? (
                      <Input
                        type="text"
                        value={editRegion}
                        onChange={(e) => setEditRegion(e.target.value)}
                        className="min-w-[100px]"
                      />
                    ) : (
                      <span className="text-sm text-slate-400">
                        {loc.region ?? "\u2014"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === loc.id ? (
                      <Input
                        type="text"
                        value={editDifficulty}
                        onChange={(e) => setEditDifficulty(e.target.value)}
                        className="min-w-[80px]"
                      />
                    ) : (
                      <span className="text-sm text-slate-400">
                        {loc.difficulty ?? "\u2014"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === loc.id ? (
                      <Input
                        type="number"
                        value={editDepthMax}
                        onChange={(e) => setEditDepthMax(e.target.value)}
                        className="min-w-[60px]"
                      />
                    ) : (
                      <span className="text-sm text-slate-400">
                        {loc.depth_max != null ? `${loc.depth_max}m` : "\u2014"}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {editingId === loc.id ? (
                      <div className="flex items-center gap-1">
                        <Button
                          onClick={() => handleUpdate(loc.id)}
                          variant="ghost"
                          size="icon-sm"
                          className="text-emerald-400 hover:text-emerald-300"
                          aria-label={t("save")}
                          title={t("save")}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={handleCancelEdit}
                          variant="ghost"
                          size="icon-sm"
                          className="text-slate-400 hover:text-white"
                          aria-label={t("close")}
                          title={t("close")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Button
                          onClick={() => handleStartEdit(loc)}
                          variant="ghost"
                          size="icon-sm"
                          className="text-slate-400 hover:text-white"
                          aria-label={t("edit")}
                          title={t("edit")}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(loc.id, loc.name)}
                          variant="ghost"
                          size="icon-sm"
                          className="text-red-400 hover:text-red-300"
                          aria-label={t("delete")}
                          title={t("delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
