import { api } from "@/lib/api";
import { NotificationResponse } from "@/types/notification";

export const NotificationService = {
  async list(page = 1, pageSize = 25): Promise<NotificationResponse> {
    try {
      const { data } = await api.get<NotificationResponse>("/api/notifications", {
        params: {
          page,
          pageSize,
        },
      });
      return data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
  },

  async markAsRead(id: string): Promise<void> {
    await api.post(`/api/notifications/${id}/mark-read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.post("/api/notifications/mark-all-read");
  },
};
