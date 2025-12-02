import { create } from "zustand";
import { NotificationItem, Toast, ToastType } from "@/types/notification";

interface NotificationState {
  notifications: NotificationItem[];
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id"> & { id?: string }) => void;
  removeToast: (toastId: string) => void;
  setNotifications: (items: NotificationItem[]) => void;
  markAsRead: (documentId: string) => void;
  markAllAsRead: () => void;
  unreadCount: number;
}

const DEFAULT_DURATION = 4000;

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  toasts: [],
  unreadCount: 0,
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
      unreadCount: items.filter((item) => !item.isRead).length,
    })),
  markAsRead: (documentId) =>
    set((state) => {
      const notifications = state.notifications.map((item) =>
        item.documentId === documentId ? { ...item, isRead: true } : item
      );
      return {
        notifications,
        unreadCount: notifications.filter((item) => !item.isRead).length,
      };
    }),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((item) => ({
        ...item,
        isRead: true,
      })),
      unreadCount: 0,
    })),
}));

export const createToastPayload = (
  type: ToastType,
  title: string,
  description?: string
) => ({
  type,
  title,
  description,
});






