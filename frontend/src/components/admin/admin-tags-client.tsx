"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { Plus, Trash2, Save, X } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { TableSkeleton } from "@/components/admin/loading-skeleton";
import { EmptyState } from "@/components/admin/empty-state";
import { ConfirmDialog, useConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";

type Tag = {
  id: string;
  name: string;
  slug: string;
  count: number;
};

export function AdminTagsClient() {
  const t = useTranslations("admin");
  const confirmDialog = useConfirmDialog();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");

  const generateSlug = useCallback((name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }, []);

  const loadTags = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getTags();
      setTags(
        data.map((t) => ({
          ...t,
          slug: generateSlug(t.name),
          count: 0,
        }))
      );
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t, generateSlug]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error(t("nameRequired"));
      return;
    }
    try {
      await adminApi.createTag({
        name: newName,
      });
      toast.success(t("tagCreated"));
      setNewName("");
      setShowAddForm(false);
      loadTags();
    } catch {
      toast.error(t("saveError"));
    }
  };

  const handleDelete = async (id: string, name: string) => {
    confirmDialog.confirm({
      title: t("confirmDelete"),
      description: t("confirmDelete") || `Are you sure you want to delete "${name}"?`,
      onConfirm: async () => {
        try {
          await adminApi.deleteTag(id);
          toast.success(t("tagDeleted"));
          loadTags();
        } catch {
          toast.error(t("saveError"));
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader titleKey="tags">
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          <Plus className="h-4 w-4" />
          {t("add")}
        </Button>
      </PageHeader>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={confirmDialog.onOpenChange}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={t("delete")}
        cancelLabel={t("close")}
        variant="destructive"
        onConfirm={confirmDialog.onConfirm}
      />

      {/* Add Form */}
      {showAddForm && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-4">
            <label className="mb-1 block text-sm text-slate-400">
              {t("name")}
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 transition-colors hover:border-slate-600 focus-visible:border-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
              placeholder={t("name")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreate();
                }
              }}
            />
            {newName && (
              <p className="mt-1 text-xs text-slate-500">
                {t("slug")}: {generateSlug(newName)}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              <Save className="h-4 w-4" />
              {t("save")}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewName("");
              }}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700"
            >
              <X className="h-4 w-4" />
              {t("close")}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : tags.length === 0 ? (
        <EmptyState title={t("noResults")} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("name")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("slug")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("count")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {tags.map((tag) => (
                <tr key={tag.id} className="transition-colors hover:bg-slate-800/50">
                  <td className="px-4 py-3 text-sm text-slate-300">
                    {tag.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {tag.slug}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">
                    {tag.count}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Button
                      onClick={() => handleDelete(tag.id, tag.name)}
                      variant="ghost"
                      size="icon-sm"
                      className="text-red-400 hover:text-red-300"
                      aria-label={t("delete")}
                      title={t("delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
