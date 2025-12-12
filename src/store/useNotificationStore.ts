import { create } from "zustand";
import { NotificationItem, Toast, ToastType } from "@/types/notification";
import { NotificationService } from "@/services/notification.service";

interface NotificationState {
  notifications: NotificationItem[];
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id"> & { id?: string }) => void;
  removeToast: (toastId: string) => void;
  setNotifications: (items: NotificationItem[]) => void;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  unreadCount: number;
  reset: () => void;
}

const DEFAULT_DURATION = 4000;

/**
 * Mapea una notificación del backend para agregar isRead (compat con UI)
 */
const mapNotification = (
  item: NotificationItem,
  isRead: boolean,
): NotificationItem => ({
  ...item,
  isRead,
  read: isRead,
});

const initialState = {
  notifications: [],
  toasts: [],
  unreadCount: 0,
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  ...initialState,
  addToast: (toast) => {
    const id = toast.id ?? crypto.randomUUID();
    const newToast: Toast = {
      id,
      duration: DEFAULT_DURATION,
      ...toast,
    };
    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    if (newToast.duration) {
      setTimeout(() => {
        get().removeToast(id);
      }, newToast.duration);
    }
  },
  removeToast: (toastId) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== toastId),
    })),
  setNotifications: (items) =>
    set(() => ({
      notifications: items,
      unreadCount: items.filter((item) => !item.read && !item.isRead).length,
    })),
  fetchNotifications: async () => {
    try {
      const { data, meta } = await NotificationService.list(1, 10);
      const unread = data.unread.map((item) => mapNotification(item, false));
      const read = data.read.map((item) => mapNotification(item, true));

      const items = [...unread, ...read];
      set(() => ({
        notifications: items,
        unreadCount: meta.unreadCount,
      }));
    } catch (error) {
      console.error("Error fetching notifications in store:", error);
    }
  },
  markAsRead: (id) =>
    set((state) => {
      const notifications = state.notifications.map((item) =>
        item.id === id ? { ...item, isRead: true, read: true } : item,
      );
      return {
        notifications,
        unreadCount: notifications.filter((item) => !item.read && !item.isRead)
          .length,
      };
    }),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((item) => ({
        ...item,
        isRead: true,
        read: true,
      })),
      unreadCount: 0,
    })),
  reset: () => set(initialState),
}));

export const createToastPayload = (
  type: ToastType,
  title: string,
  description?: string,
) => ({
  type,
  title,
  description,
});
