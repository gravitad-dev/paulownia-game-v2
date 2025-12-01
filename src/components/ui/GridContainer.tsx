"use client";

import { ReactNode } from "react";
import { CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Loader2, LucideIcon } from "lucide-react";

export interface GridContainerProps {
  /**
   * Items a mostrar en el grid
   */
  children: ReactNode;
  /**
   * Estado de carga
   */
  isLoading?: boolean;
  /**
   * Mensaje cuando está vacío
   */
  emptyMessage?: string;
  /**
   * Icono para el estado vacío
   */
  emptyIcon?: LucideIcon;
  /**
   * Número de columnas en diferentes breakpoints
   * @default "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
   */
  gridCols?: string;
  /**
   * Gap entre elementos
   * @default "gap-3 sm:gap-4"
   */
  gap?: string;
  /**
   * Padding del contenedor
   * @default "p-6"
   */
  padding?: string;
  /**
   * Espaciado vertical entre secciones
   * @default "space-y-6"
   */
  spacing?: string;
  /**
   * Clases adicionales para el grid
   */
  className?: string;
  /**
   * Mostrar contenido incluso si está vacío
   */
  showEmpty?: boolean;
}

/**
 * Contenedor reutilizable para grids de recompensas/logros
 *
 * Características:
 * - Grid responsive configurable
 * - Estados de carga y vacío
 * - Configuración flexible de columnas y espaciado
 *
 * @example
 * ```tsx
 * <GridContainer
 *   isLoading={isLoading}
 *   emptyMessage="No hay recompensas disponibles"
 *   emptyIcon={Gift}
 * >
 *   {rewards.map(reward => (
 *     <RewardCard key={reward.id} {...reward} />
 *   ))}
 * </GridContainer>
 * ```
 */
export function GridContainer({
  children,
  isLoading = false,
  emptyMessage = "No hay elementos disponibles",
  emptyIcon: EmptyIcon,
  gridCols = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  gap = "gap-3 sm:gap-4",
  padding = "p-0",
  spacing = "space-y-0",
  className,
  showEmpty = false,
}: GridContainerProps) {
  const hasChildren = Array.isArray(children)
    ? children.length > 0
    : children != null;

  return (
    <CardContent className={cn(padding, spacing)}>
      {isLoading && !hasChildren ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !hasChildren && !showEmpty ? (
        <div className="text-center py-12 text-muted-foreground">
          {EmptyIcon && (
            <EmptyIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
          )}
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className={cn("grid", gridCols, gap, className)}>{children}</div>
      )}
    </CardContent>
  );
}
