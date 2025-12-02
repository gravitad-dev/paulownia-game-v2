export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

export interface NotificationItem {
  documentId: string;
  title: string;
  description: string;
  createdAt: string;
  isRead: boolean;
}







