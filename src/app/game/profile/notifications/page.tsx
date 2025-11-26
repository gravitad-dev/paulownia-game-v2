"use client";

import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotificationsPage() {
  return (
    <>
      <CardHeader className="sticky top-0 z-10 bg-card space-y-0 p-0 shrink-0 border-b border-border/50">
        <div className="flex flex-row items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-3">
          <CardTitle className="text-lg font-semibold sm:text-xl">
            Notificaciones
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex h-full flex-col items-center justify-center text-center py-8">
          <p className="text-sm text-muted-foreground max-w-md">
            Todas tus notificaciones en un solo lugar. Contenido en desarrollo...
          </p>
        </div>
      </CardContent>
    </>
  );
}

