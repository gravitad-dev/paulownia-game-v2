import { NotificationItem } from "@/types/notification";

const mockNotifications: NotificationItem[] = [
  {
    documentId: "doc-1",
    title: "Actualización disponible",
    description:
      "Tenemos nuevas misiones y recompensas para esta semana, ¡revísalas!",
    createdAt: new Date().toISOString(),
    isRead: false,
  },
  {
    documentId: "doc-2",
    title: "Perfil incompleto",
    description: "Completa tus datos para desbloquear todas las funciones.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    isRead: false,
  },
  {
    documentId: "doc-3",
    title: "Bienvenido a Paulownia",
    description: "Gracias por unirte a nuestra comunidad gamer.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    isRead: true,
  },
];

export const NotificationService = {
  async list(): Promise<NotificationItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return mockNotifications;
  },
  async markAsRead(documentId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const notification = mockNotifications.find(
      (item) => item.documentId === documentId
    );
    if (notification) notification.isRead = true;
  },
  async markAllAsRead(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    mockNotifications.forEach((item) => {
      item.isRead = true;
    });
  },
};










