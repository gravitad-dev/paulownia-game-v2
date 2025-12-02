"use client";

import { useRef, useCallback } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TicketSelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
  rate: number;
  disabled?: boolean;
  className?: string;
}

/**
 * Selector de cantidad de tickets con botones +/-
 * Muestra el costo en monedas en tiempo real
 * Soporta hold para incremento/decremento continuo
 */
export function TicketSelector({
  value,
  onChange,
  min = 1,
  max,
  rate,
  disabled = false,
  className,
}: TicketSelectorProps) {
  const cost = value * rate;
  const canDecrease = value > min && !disabled;
  const canIncrease = value < max && !disabled;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  const stopHold = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startHold = useCallback(
    (direction: "increase" | "decrease") => {
      stopHold();

      // Delay inicial antes de empezar el incremento continuo
      const timeout = setTimeout(() => {
        intervalRef.current = setInterval(() => {
          const current = valueRef.current;
          if (direction === "increase" && current < max) {
            onChange(current + 1);
          } else if (direction === "decrease" && current > min) {
            onChange(current - 1);
          } else {
            stopHold();
          }
        }, 80); // Velocidad del incremento
      }, 300); // Delay antes de empezar

      intervalRef.current = timeout as unknown as NodeJS.Timeout;
    },
    [max, min, onChange, stopHold],
  );

  const handleDecrease = () => {
    if (canDecrease) {
      onChange(value - 1);
    }
  };

  const handleIncrease = () => {
    if (canIncrease) {
      onChange(value + 1);
    }
  };

  // Ajustes rápidos
  const quickValues = [1, 5, 10].filter((v) => v <= max);

  return (
    <div className={cn("space-y-4 pt-4", className)}>
      <p className="text-sm text-muted-foreground text-center">
        ¿Cuántos tickets quieres obtener?
      </p>

      {/* Selector principal */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handleDecrease}
          onMouseDown={() => startHold("decrease")}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
          onTouchStart={() => startHold("decrease")}
          onTouchEnd={stopHold}
          disabled={!canDecrease}
          className="h-12 w-12 rounded-full"
        >
          <Minus className="h-5 w-5" />
        </Button>

        <div className="min-w-24 text-center">
          <span className="text-4xl font-bold">{value}</span>
          <p className="text-xs text-muted-foreground mt-1">
            {value === 1 ? "ticket" : "tickets"}
          </p>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleIncrease}
          onMouseDown={() => startHold("increase")}
          onMouseUp={stopHold}
          onMouseLeave={stopHold}
          onTouchStart={() => startHold("increase")}
          onTouchEnd={stopHold}
          disabled={!canIncrease}
          className="h-12 w-12 rounded-full"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Costo */}
      <div className="text-center py-3 px-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">Costo:</p>
        <p className="text-xl font-semibold text-amber-600 dark:text-amber-400">
          {cost.toLocaleString()} monedas
        </p>
      </div>

      {/* Botones de ajuste rápido */}
      {quickValues.length > 1 && (
        <div className="flex justify-center gap-2">
          {quickValues.map((qv) => (
            <Button
              key={qv}
              variant={value === qv ? "default" : "outline"}
              size="sm"
              onClick={() => onChange(qv)}
              disabled={disabled}
              className="min-w-12"
            >
              {qv}
            </Button>
          ))}
          {max > 10 && (
            <Button
              variant={value === max ? "default" : "outline"}
              size="sm"
              onClick={() => onChange(max)}
              disabled={disabled}
              className="min-w-12"
            >
              Max
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
