export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

export type NotificationType =
  | "REWARD_AVAILABLE"
  | "REWARD_STATUS_UPDATE"
  | "PROFILE_INCOMPLETE"
  | "WELCOME";

export type NotificationPriority = "HIGH" | "MEDIUM" | "LOW";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  priority: NotificationPriority;
  metadata?: Record<string, unknown>;
  /** Estado de lectura */
  read: boolean;
  /** Timestamp de cuando fue leída */
  readAt?: string | null;
  /** Entidad relacionada (user-reward, reward-claim, etc) */
  relatedEntity?: string;
  /** ID de la entidad relacionada */
  relatedEntityId?: number;
  /** @deprecated Use 'read' instead - kept for backward compatibility in UI */
  isRead?: boolean;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface NotificationResponse {
  data: {
    unread: NotificationItem[];
    read: NotificationItem[];
  };
  meta: {
    hasNotifications: boolean;
    unreadCount: number;
    readCount: number;
    totalCount: number;
    pagination: PaginationMeta;
  };
}

