"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotificationStore } from "@/store/useNotificationStore";
import { NotificationService } from "@/services/notification.service";
import { NotificationItem } from "@/types/notification";
import { cn } from "@/lib/utils";
import { FiBell } from "react-icons/fi";
import { useRouter } from "next/navigation";

const formatDate = (dateString: string) =>
  new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));

interface NotificationIndicatorProps {
  className?: string;
}

export function NotificationIndicator({
  className,
}: NotificationIndicatorProps) {
  const router = useRouter();
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const fetchNotifications = useNotificationStore(
    (state) => state.fetchNotifications,
  );
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Si ya hay notificaciones cargadas, no recargar automáticamente para respetar caché
    // (o podríamos decidir recargar siempre si queremos frescura absoluta)
    if (notifications.length) return;

    const initLoad = async () => {
      setLoading(true);
      await fetchNotifications();
      setLoading(false);
    };

    initLoad();
  }, [notifications.length, fetchNotifications]);

  const sortedNotifications = useMemo(
    () =>
      [...notifications].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [notifications],
  );

  const unreadNotifications = sortedNotifications.filter(
    (item) => !item.isRead,
  );
  const readNotifications = sortedNotifications.filter((item) => item.isRead);

  const handleMarkAsRead = async (id: string) => {
    markAsRead(id);
    try {
      await NotificationService.markAsRead(id);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    markAllAsRead();
    try {
      await NotificationService.markAllAsRead();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const renderNotification = (item: NotificationItem) => {
    const isRewardNotification =
      item.type === "REWARD_AVAILABLE" || item.type === "REWARD_STATUS_UPDATE";
    const isProfileNotification = item.type === "PROFILE_INCOMPLETE";

    // Es clickeable si tiene un link O si no está leída (para marcarla como leída)
    const isClickable =
      isRewardNotification || isProfileNotification || !item.isRead;

    return (
      <button
        key={item.id}
        type="button"
        disabled={!isClickable}
        className={cn(
          "w-full text-left rounded-lg border border-transparent px-4 py-3 transition hover:border-border",
          item.isRead ? "bg-muted/20" : "bg-white",
          isClickable && "hover:bg-muted/50 cursor-pointer",
          !isClickable && "cursor-default",
        )}
        onClick={() => {
          if (!isClickable) return;

          handleMarkAsRead(item.id);
          if (isRewardNotification) {
            router.push("/game/profile/awards");
          } else if (isProfileNotification) {
            router.push("/game/profile/settings");
          }
        }}
      >
        <p className="text-sm font-semibold text-foreground">{item.title}</p>
        <p className="text-xs text-muted-foreground mt-1">{item.message}</p>
        <span className="text-[11px] text-muted-foreground/80 mt-2 block">
          {formatDate(item.createdAt)}
        </span>
      </button>
    );
  };

  return (
    <div className={className}>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center text-xl text-foreground transition hover:text-primary"
            aria-label="Notificaciones"
          >
            <FiBell />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                {unreadCount}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-96 p-0">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Notificaciones
              </p>
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} sin leer` : "Todo al día"}
              </p>
            </div>
            <button
              type="button"
              className="text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50"
              onClick={handleMarkAllAsRead}
              disabled={!unreadCount}
            >
              Marcar todas leídas
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto px-3 py-3 bg-muted/30">
            {loading ? (
              <p className="text-center text-sm text-muted-foreground py-6">
                Cargando...
              </p>
            ) : sortedNotifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                <span className="text-2xl" role="img" aria-hidden="true">
                  ✨
                </span>
                <p className="text-sm font-medium">Sin notificaciones</p>
                <p className="text-xs text-center">
                  Aquí verás los avisos más importantes del juego.
                </p>
              </div>
            ) : (
              <>
                {unreadNotifications.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground px-2">
                      No leídas
                    </p>
                    {unreadNotifications.map(renderNotification)}
                  </div>
                )}

                {readNotifications.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground px-2">
                      Leídas
                    </p>
                    {readNotifications.map(renderNotification)}
                  </div>
                )}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
