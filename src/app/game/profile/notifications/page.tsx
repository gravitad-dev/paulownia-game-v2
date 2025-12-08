"use client";

import { CardHeaderSticky } from "@/components/ui/CardHeaderSticky";
import { ContentLoading } from "@/components/ui/ContentLoading";

export default function NotificationsPage() {
  const isLoading = false;

  return (
    <div className="flex flex-col h-full">
      <CardHeaderSticky title="Notificaciones" />
      <div className="flex-1 p-4 flex items-center justify-center">
        {isLoading ? (
          <ContentLoading message="Cargando notificaciones..." />
        ) : (
          <div className="text-center">
            <p className="text-sm text-muted-foreground max-w-md">
              Todas tus notificaciones en un solo lugar. Contenido en
              desarrollo...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
