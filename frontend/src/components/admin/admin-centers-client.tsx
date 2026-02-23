"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { toast } from "sonner";
import { adminApi, type PublicCenter } from "@/lib/api";
import { CheckCircle, XCircle, Eye, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { AdminTable, type ColumnDef, type FilterDef } from "@/components/admin/admin-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, useConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function AdminCentersClient() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const confirmDialog = useConfirmDialog();
  const [centers, setCenters] = useState<PublicCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [detailCenter, setDetailCenter] = useState<PublicCenter | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    adminApi
      .getCenters()
      .then(setCenters)
      .catch(() => {
        setError(t("loadError"));
        toast.error(t("loadError"));
      })
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = useCallback(
    async (id: string) => {
      setActionId(id);
      try {
        await adminApi.approveCenter(id);
        toast.success(t("centerApproved"));
        load();
      } catch {
        toast.error(t("saveError"));
      } finally {
        setActionId(null);
      }
    },
    [t, load]
  );

  const handleReject = useCallback(
    (id: string) => {
      confirmDialog.confirm({
        title: t("confirmReject"),
        description: t("confirmRejectDescription"),
        onConfirm: async () => {
          setActionId(id);
          try {
            await adminApi.rejectCenter(id);
            toast.success(t("centerRejected"));
            load();
          } catch {
            toast.error(t("saveError"));
          } finally {
            setActionId(null);
          }
        },
      });
    },
    [t, load, confirmDialog]
  );

  const formatDate = (d: string): string =>
    format.dateTime(new Date(d), {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const columns: ColumnDef<PublicCenter>[] = [
    {
      key: "name",
      labelKey: "name",
      accessor: (c) => c.name,
      render: (c) => (
        <span className="font-medium text-white">
          {c.name}
        </span>
      ),
    },
    {
      key: "city",
      labelKey: "city",
      accessor: (c) => c.city ?? "",
      render: (c) => (
        <span className="text-slate-300">{c.city || "-"}</span>
      ),
    },
    {
      key: "country",
      labelKey: "country",
      accessor: (c) => c.country ?? "",
      render: (c) => (
        <span className="text-slate-300">{c.country || "-"}</span>
      ),
    },
    {
      key: "owners",
      labelKey: "ownerEmail",
      sortable: false,
      render: () => (
        <span className="text-xs text-slate-400">-</span>
      ),
    },
    {
      key: "status",
      labelKey: "status",
      accessor: (c) => c.status,
      render: (c) => <StatusBadge status={c.status} />,
    },
    {
      key: "created_at",
      labelKey: "date",
      accessor: (c) => c.created_at,
      render: (c) => (
        <span className="text-slate-400">{formatDate(c.created_at)}</span>
      ),
    },
  ];

  const filters: FilterDef[] = [
    {
      key: "status",
      labelKey: "status",
      options: [
        { value: "pending", label: t("pending") },
        { value: "active", label: t("approved") },
        { value: "rejected", label: t("rejected") },
        { value: "suspended", label: t("suspended") },
      ],
    },
  ];

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <PageHeader titleKey="centers" />
        <div className="rounded-lg bg-red-500/20 px-4 py-3 text-red-400">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader titleKey="centers" />

      <AdminTable
        columns={columns}
        data={centers}
        rowKey={(c) => c.id}
        searchFields={[
          (c) => c.name,
          (c) => c.city,
          (c) => c.country,
          () => null,
        ]}
        filters={filters}
        loading={loading}
        defaultSortKey="created_at"
        defaultSortDir="desc"
        renderActions={(c) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setDetailCenter(c)}
              className="text-slate-400 hover:text-cyan-400"
              title={t("viewProfile")}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {c.status === "pending" && (
              <>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleApprove(c.id)}
                  disabled={actionId === c.id}
                  className="text-emerald-400 hover:bg-emerald-500/10"
                  title={t("approve")}
                >
                  {actionId === c.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleReject(c.id)}
                  disabled={actionId === c.id}
                  className="text-red-400 hover:bg-red-500/10"
                  title={t("reject")}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )}
      />

      {/* Confirm dialog for reject */}
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={confirmDialog.onOpenChange}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={t("reject")}
        cancelLabel={t("cancel")}
        variant="destructive"
        onConfirm={confirmDialog.onConfirm}
      />

      {/* Center detail dialog */}
      <Dialog open={!!detailCenter} onOpenChange={(open) => !open && setDetailCenter(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto border-slate-800 bg-slate-900 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">
              {detailCenter?.name}
            </DialogTitle>
          </DialogHeader>
          {detailCenter && (
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoItem label={t("id")} value={detailCenter.id} mono />
              <InfoItem label={t("name")} value={detailCenter.name} />
              <InfoItem label={t("status")} value={detailCenter.status} badge />
              <InfoItem label={t("city")} value={detailCenter.city} />
              <InfoItem label={t("country")} value={detailCenter.country} />
              <InfoItem label={t("address")} value={detailCenter.address} />
              <InfoItem label={t("zip")} value={detailCenter.postal_code} />
              <InfoItem label={t("phone")} value={detailCenter.phone} />
              <InfoItem label={t("website")} value={detailCenter.website} />
              <InfoItem label={t("slug")} value={detailCenter.slug} mono />
              <InfoItem label={t("featured")} value={detailCenter.is_featured ? tCommon("yes") : tCommon("no")} />
              {detailCenter.description && (
                <div className="sm:col-span-2">
                  <p className="mb-1 text-xs font-medium text-slate-500">{t("description")}</p>
                  <p className="text-sm text-slate-300">{detailCenter.description}</p>
                </div>
              )}
              <InfoItem label={t("date")} value={formatDate(detailCenter.created_at)} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoItem({
  label,
  value,
  mono,
  badge,
}: {
  label: string;
  value: string | number | null | undefined;
  mono?: boolean;
  badge?: boolean;
}) {
  return (
    <div>
      <p className="mb-0.5 text-xs font-medium text-slate-500">{label}</p>
      {badge && value ? (
        <StatusBadge status={String(value)} />
      ) : (
        <p className={`text-sm ${mono ? "font-mono text-xs" : ""} text-slate-300`}>
          {value ?? "-"}
        </p>
      )}
    </div>
  );
}
