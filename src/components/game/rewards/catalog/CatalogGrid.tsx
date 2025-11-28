"use client";

import { Gift } from "lucide-react";
import { CatalogCard } from "./CatalogCard";
import { cn } from "@/lib/utils";
import type { CatalogReward } from "@/types/reward";

interface CatalogGridProps {
  rewards: CatalogReward[];
  isLoading?: boolean;
  className?: string;
}

export function CatalogGrid({
  rewards,
  isLoading = false,
  className,
}: CatalogGridProps) {
  const gridClasses = cn(
    "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2",
    className,
  );

  // Estado vacío (solo si no está cargando y no hay rewards)
  if (!isLoading && rewards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in duration-300">
        <div className="p-4 bg-muted rounded-full mb-4">
          <Gift className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-lg mb-1">No hay premios disponibles</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          No se encontraron premios con los filtros seleccionados.
        </p>
      </div>
    );
  }

  return (
    <div className={gridClasses}>
      {rewards.map((reward, index) => (
        <div
          key={reward.uuid}
          className="animate-in fade-in slide-in-from-bottom-1 duration-500 ease-out"
          style={{
            animationDelay: `${index * 50}ms`,
            animationFillMode: "both",
          }}
        >
          <CatalogCard reward={reward} />
        </div>
      ))}
    </div>
  );
}
