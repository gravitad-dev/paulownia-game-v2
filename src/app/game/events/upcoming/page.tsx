"use client";

import { CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function UpcomingEventsPage() {
  return (
    <CardContent className="p-6 py-16">
      <div className="text-center text-muted-foreground">
        <Calendar className="h-16 w-16 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium">Próximamente</p>
        <p className="text-sm mt-2 max-w-md mx-auto">
          Nuevos eventos especiales y torneos estarán disponibles muy pronto.
          ¡Mantente atento!
        </p>
      </div>
    </CardContent>
  );
}
