"use client";

import { Ticket, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SpinButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isSpinning?: boolean;
  ticketCount: number;
  className?: string;
  requiresPremium?: boolean;
}

/**
 * Botón para girar la ruleta
 */
export function SpinButton({
  onClick,
  disabled = false,
  isSpinning = false,
  ticketCount,
  className,
  requiresPremium = false,
}: SpinButtonProps) {
  // Si requiere premium, el botón está habilitado pero muestra candado y otra acción
  const canSpin =
    (ticketCount > 0 && !disabled && !isSpinning) || requiresPremium;

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <Button
        onClick={onClick}
        disabled={!canSpin}
        size="lg"
        variant={requiresPremium ? "secondary" : "default"}
        className={cn(
          "h-14 px-8 text-lg font-semibold shadow-lg transition-all",
          isSpinning && "animate-pulse",
          requiresPremium &&
            "bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/30",
        )}
      >
        {requiresPremium ? (
          <Lock className="h-5 w-5 mr-2 text-amber-500" />
        ) : (
          <Ticket className="h-5 w-5 mr-2" />
        )}
        {requiresPremium
          ? "Exclusivo Premium"
          : isSpinning
          ? "Girando..."
          : "Girar Ruleta"}
      </Button>

      <p className="text-sm text-muted-foreground">
        {requiresPremium ? (
          <span className="text-amber-600 font-medium">
            Desbloquea premios exclusivos
          </span>
        ) : ticketCount > 0 ? (
          <>
            Tienes{" "}
            <span className="font-semibold text-foreground">
              {ticketCount} ticket{ticketCount !== 1 ? "s" : ""}
            </span>{" "}
            disponible{ticketCount !== 1 ? "s" : ""}
          </>
        ) : (
          "Necesitas tickets para girar"
        )}
      </p>
    </div>
  );
}
