"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { toast } from "sonner";
import { adminApi, type AdminNotification } from "@/lib/api";
import { Bell, CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { TableSkeleton } from "@/components/admin/loading-skeleton";
import { EmptyState } from "@/components/admin/empty-state";
import { Button } from "@/components/ui/button";

export function AdminNotificationsClient(): React.JSX.Element {
  const t = useTranslations("admin");
  const format = useFormatter();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getNotifications();
      setNotifications(data);
    } catch {
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAllRead = async (): Promise<void> => {
    try {
      await adminApi.markAllNotificationsRead();
      toast.success(t("allMarkedRead"));
      loadNotifications();
    } catch {
      toast.error(t("saveError"));
    }
  };

  const handleMarkRead = async (id: string): Promise<void> => {
    try {
      await adminApi.markNotificationRead(id);
      loadNotifications();
    } catch {
      toast.error(t("saveError"));
    }
  };

  const formatDate = (dateString: string): string => {
    return format.dateTime(new Date(dateString), {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <PageHeader titleKey="notifications">
        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllRead}
            className="bg-cyan-600 text-white hover:bg-cyan-700"
          >
            <CheckCircle2 className="h-4 w-4" />
            {t("markAllRead")}
          </Button>
        )}
      </PageHeader>

      {loading ? (
        <TableSkeleton rows={5} cols={1} />
      ) : notifications.length === 0 ? (
        <EmptyState icon={Bell} title={t("noResults")} />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <button
              type="button"
              key={notification.id}
              onClick={() => !notification.is_read && handleMarkRead(notification.id)}
              className={`group relative w-full cursor-pointer rounded-xl border bg-slate-900 p-4 text-left transition-all hover:bg-slate-800/50 dark:bg-slate-800 dark:hover:bg-slate-700/50 ${
                notification.is_read
                  ? "border-slate-800 dark:border-slate-700"
                  : "border-l-4 border-l-blue-500 border-slate-800 dark:border-slate-700"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {notification.is_read ? (
                    <Circle className="h-4 w-4 text-slate-600" />
                  ) : (
                    <div className="h-4 w-4 rounded-full bg-blue-500" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-sm font-semibold text-slate-200">
                    {notification.title}
                  </h3>
                  <p className="mb-2 text-sm text-slate-400">
                    {notification.body}
                  </p>
                  {notification.link && (
                    <a
                      href={notification.link}
                      className="mb-2 inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3 w-3" />
                      {t("viewDetails")}
                    </a>
                  )}
                  <p className="text-xs text-slate-500">
                    {formatDate(notification.created_at)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
