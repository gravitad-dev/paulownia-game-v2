"use client";

import { CardHeaderSticky } from "@/components/ui/CardHeaderSticky";

export default function NotificationsPage() {
  return (
    <div className="flex flex-col h-full">
      <CardHeaderSticky title="Notificaciones" />
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground max-w-md">
            Todas tus notificaciones en un solo lugar. Contenido en desarrollo...
          </p>
        </div>
      </div>
    </div>
  );
}
