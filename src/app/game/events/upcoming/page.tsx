"use client";

import { Calendar } from "lucide-react";
import { CardHeaderSticky } from "@/components/ui/CardHeaderSticky";
import { ContentLoading } from "@/components/ui/ContentLoading";

export default function UpcomingEventsPage() {
  const isLoading = false;

  return (
    <div className="flex flex-col h-full">
      <CardHeaderSticky title="Próximos Eventos" />

      <div className="flex-1 p-4 flex items-center justify-center">
        {isLoading ? (
          <ContentLoading message="Cargando eventos..." />
        ) : (
          <div className="text-center text-muted-foreground">
            <Calendar className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Próximamente</p>
            <p className="text-sm mt-2 max-w-md mx-auto">
              Nuevos eventos especiales y torneos estarán disponibles muy pronto.
              ¡Mantente atento!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
