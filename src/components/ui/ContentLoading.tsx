"use client";

import { Loader2 } from "lucide-react";

interface ContentLoadingProps {
  message?: string;
}

/**
 * Loading estándar para vistas internas dentro de cards.
 * Mantiene la altura mínima y layout usados en rewards/page.tsx.
 */
export function ContentLoading({ message = "Cargando..." }: ContentLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 min-h-[400px]">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}

