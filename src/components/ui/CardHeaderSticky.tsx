"use client";

import { ReactNode } from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CardHeaderStickyProps {
  title: string;
  subtitle?: string;
  titleIcon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
}

/**
 * Header estándar y reutilizable para las vistas internas de juego.
 *
 * - Sticky dentro del contenedor scrolleable
 * - Soporta icono de título, subtítulo y acciones (botones)
 * - Tipografías unificadas con el diseño de perfil/settings
 */
export function CardHeaderSticky({
  title,
  subtitle,
  titleIcon: TitleIcon,
  actions,
  className,
}: CardHeaderStickyProps) {
  return (
    <CardHeader
      className={cn(
        "sticky top-0 z-10 bg-card space-y-0 p-0 shrink-0 border-b border-border/50 rounded-t-lg",
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 sm:px-6 sm:py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {TitleIcon && (
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <TitleIcon className="h-4 w-4 text-primary" />
              </div>
            )}
            <CardTitle className="text-lg font-semibold sm:text-xl truncate">
              {title}
            </CardTitle>
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-snug line-clamp-2">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto sm:justify-end">
            {actions}
          </div>
        )}
      </div>
    </CardHeader>
  );
}
