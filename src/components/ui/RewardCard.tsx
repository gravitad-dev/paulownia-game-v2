"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { Card, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { getStrapiImageUrl } from "@/lib/image-utils";

export interface RewardCardProps {
  /**
   * Título o nombre de la recompensa
   */
  name: string;
  /**
   * Imagen de la recompensa
   */
  image?: { url: string } | null;
  /**
   * URL de fallback si no hay imagen
   */
  fallbackImage?: string;
  /**
   * Estado visual de la carta (afecta opacidad, filtros, etc)
   */
  status?: "locked" | "available" | "claimed" | "completed";
  /**
   * Texto del botón
   */
  buttonText: string;
  /**
   * Icono del botón
   */
  buttonIcon?: LucideIcon;
  /**
   * Callback al hacer click en el botón
   */
  onAction?: () => void;
  /**
   * Estado de carga del botón
   */
  isLoading?: boolean;
  /**
   * Variante del botón
   */
  buttonVariant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  /**
   * Deshabilitar botón
   */
  disabled?: boolean;
  /**
   * Clases adicionales
   */
  className?: string;
}

const DEFAULT_FALLBACK =
  "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&h=600&fit=crop&q=60&auto=format";

/**
 * Componente reutilizable para mostrar tarjetas de recompensas/logros
 *
 * Características:
 * - Imagen responsiva con fallback
 * - Diferentes estados visuales (locked, available, claimed, completed)
 * - Botón personalizable con icono y estado de carga
 * - Altura fija responsive
 * - Animación hover
 *
 * @example
 * ```tsx
 * <RewardCard
 *   name="Recompensa Día 1"
 *   image={reward.image}
 *   status="available"
 *   buttonText="Reclamar"
 *   buttonIcon={Gift}
 *   onAction={handleClaim}
 *   isLoading={isClaiming}
 * />
 * ```
 */
export function RewardCard({
  name,
  image,
  fallbackImage = DEFAULT_FALLBACK,
  status = "available",
  buttonText,
  buttonIcon: ButtonIcon,
  onAction,
  isLoading = false,
  buttonVariant = "default",
  disabled = false,
  className,
}: RewardCardProps) {
  const imageUrl = getStrapiImageUrl(image?.url) || fallbackImage;

  const isDisabled = disabled || isLoading || !onAction;
  const effectiveVariant = status === "locked" ? "outline" : buttonVariant;

  return (
    <Card
      className={cn(
        "flex flex-col overflow-hidden hover:shadow-lg transition-shadow h-60 sm:h-[260px] md:h-[280px]",
        className,
      )}
    >
      <div className="relative flex-1 bg-muted overflow-hidden">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className={cn(
            "object-cover transition-all duration-300",
            status === "locked" && "grayscale opacity-70",
            status === "claimed" && "opacity-80",
            status === "completed" && "opacity-80",
          )}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </div>
      <CardFooter className="p-4">
        <Button
          className="w-full"
          onClick={onAction}
          disabled={isDisabled}
          variant={effectiveVariant}
        >
          {isLoading && ButtonIcon && (
            <ButtonIcon className="h-4 w-4 mr-2 animate-spin" />
          )}
          {!isLoading && ButtonIcon && <ButtonIcon className="h-4 w-4 mr-2" />}
          {buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
}
