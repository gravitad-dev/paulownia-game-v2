"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardHeaderSticky } from "@/components/ui/CardHeaderSticky";
import { StandardTable } from "@/components/ui/StandardTable";
import { TablePagination } from "@/components/ui/TablePagination";
import { NotificationService } from "@/services/notification.service";
import { useNotificationStore } from "@/store/useNotificationStore";
import { NotificationItem, PaginationMeta } from "@/types/notification";
import { Mail, MailOpen, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
};

export default function NotificationsPage() {
  const router = useRouter();
  const notifications = useNotificationStore((state) => state.notifications);
  const setNotifications = useNotificationStore(
    (state) => state.setNotifications,
  );
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);

  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 6,
    pageCount: 1,
    total: 0,
  });

  const fetchNotifications = async (page = 1) => {
    setLoading(true);
    try {
      const { data, meta } = await NotificationService.list(
        page,
        pagination.pageSize,
      );

      const unread = data.unread.map((item) => ({
        ...item,
        isRead: false,
      })) as NotificationItem[];
      const read = data.read.map((item) => ({
        ...item,
        isRead: true,
      })) as NotificationItem[];

      setNotifications([...unread, ...read]);
      setPagination(meta.pagination);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch initial data
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMarkAsRead = async (id: string) => {
    markAsRead(id);
    try {
      await NotificationService.markAsRead(id);
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleMarkAll = async () => {
    markAllAsRead();
    try {
      await NotificationService.markAllAsRead();
      fetchNotifications(pagination.page); // Refresh to get updated status/list
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const headers = [
    {
      key: "status",
      label: "Estado",
      align: "center" as const,
      className: "w-[80px]",
    },
    { key: "message", label: "Mensaje", align: "left" as const },
    {
      key: "date",
      label: "Fecha",
      align: "right" as const,
      className: "w-[180px]",
    },
  ];

  const renderRow = (item: NotificationItem) => {
    const isRewardNotification =
      item.type === "REWARD_AVAILABLE" || item.type === "REWARD_STATUS_UPDATE";
    const isProfileNotification = item.type === "PROFILE_INCOMPLETE";

    const isClickable =
      isRewardNotification || isProfileNotification || !item.isRead;

    return (
      <tr
        key={item.id}
        className={`border-t border-border/40 transition-colors ${
          isClickable ? "cursor-pointer" : ""
        } ${
          !item.isRead
            ? "bg-success-foreground/5 hover:bg-success/10"
            : "hover:bg-muted/30"
        }`}
        onClick={() => {
          if (!item.isRead) {
            handleMarkAsRead(item.id);
          }
          if (isRewardNotification) {
            router.push("/game/profile/awards");
          } else if (isProfileNotification) {
            router.push("/game/profile/settings");
          }
        }}
      >
        <td className="px-3 py-3 text-center align-middle">
          {item.isRead ? (
            <MailOpen className="h-5 w-5 text-muted-foreground mx-auto opacity-50" />
          ) : (
            <Mail className="h-5 w-5 text-primary mx-auto" />
          )}
        </td>
        <td className="px-3 py-3 align-middle">
          <div className="flex flex-col gap-1">
            <span
              className={`text-sm ${
                !item.isRead
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {item.title}
            </span>
            <span className="text-xs text-muted-foreground line-clamp-2">
              {item.message}
            </span>
            {item.priority === "HIGH" && (
              <Badge
                variant="destructive"
                className="w-fit text-[10px] h-5 px-1.5 mt-1 text-white"
              >
                Importante
              </Badge>
            )}
          </div>
        </td>
        <td className="px-3 py-3 text-right align-middle text-xs text-muted-foreground">
          {formatDate(item.createdAt)}
        </td>
      </tr>
    );
  };

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="flex flex-col h-full">
      <CardHeaderSticky
        title="Notificaciones"
        subtitle="Historial de avisos y alertas"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchNotifications(pagination.page)}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleMarkAll}
              disabled={!hasUnread || loading}
              className="h-8 text-xs"
            >
              Marcar todas leídas
            </Button>
          </div>
        }
      />
      <div className="flex-1 p-4 overflow-hidden flex flex-col gap-4">
        <div className="flex-1 overflow-hidden flex flex-col">
          <StandardTable
            headers={headers}
            rows={notifications}
            renderRow={renderRow}
            isLoading={loading && notifications.length === 0}
            containerClassName="flex-1"
            emptyState={
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground h-full">
                <MailOpen className="h-12 w-12 mb-3 opacity-20" />
                <p>No tienes notificaciones</p>
              </div>
            }
          />
        </div>

        {pagination.total > 0 && (
          <div className="shrink-0 pt-2">
            <TablePagination
              page={pagination.page}
              pageCount={pagination.pageCount}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onPageChange={fetchNotifications}
              label="notificaciones"
            />
          </div>
        )}
      </div>
    </div>
  );
}
