"use client";

import { Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SpinButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isSpinning?: boolean;
  ticketCount: number;
  className?: string;
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
}: SpinButtonProps) {
  const canSpin = ticketCount > 0 && !disabled && !isSpinning;

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <Button
        onClick={onClick}
        disabled={!canSpin}
        size="lg"
        className={cn(
          "h-14 px-8 text-lg font-semibold shadow-lg transition-all",
          isSpinning && "animate-pulse",
        )}
      >
        <Ticket className="h-5 w-5 mr-2" />
        {isSpinning ? "Girando..." : "Girar Ruleta"}
      </Button>

      <p className="text-sm text-muted-foreground">
        {ticketCount > 0 ? (
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
