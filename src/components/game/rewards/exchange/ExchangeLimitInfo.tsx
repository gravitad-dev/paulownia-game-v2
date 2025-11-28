"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { CountdownTimer } from "@/components/game/rewards/CountdownTimer";
import { cn } from "@/lib/utils";
import type { ExchangeLimit } from "@/types/exchange";

interface ExchangeLimitInfoProps {
  limit: ExchangeLimit;
  onLimitReset?: () => void;
  className?: string;
}

/**
 * Traduce el período a español
 */
const periodLabels: Record<ExchangeLimit["period"], string> = {
  daily: "diario",
  monthly: "mensual",
  yearly: "anual",
};

/**
 * Muestra información sobre el límite de canje y countdown hasta el reset
 */
export function ExchangeLimitInfo({
  limit,
  onLimitReset,
  className,
}: ExchangeLimitInfoProps) {
  const { limitTickets, period, ticketsUsed, ticketsRemaining, nextResetDate } =
    limit;

  const isLimitReached = ticketsRemaining === 0;
  const usagePercent = (ticketsUsed / limitTickets) * 100;

  return (
    <div
      className={cn(
        "p-4 rounded-lg border",
        isLimitReached
          ? "bg-destructive/5 border-destructive/20"
          : "bg-card border-border/40 shadow-sm",
        className,
      )}
    >
      {/* Header con estado */}
      <div className="flex items-center gap-2 mb-3">
        {isLimitReached ? (
          <AlertCircle className="h-4 w-4 text-destructive/80" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-primary/80" />
        )}
        <span className="text-sm font-medium">
          Límite {periodLabels[period]}
        </span>
      </div>

      {/* Barra de progreso */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>
            {ticketsUsed} de {limitTickets} tickets usados
          </span>
          <span>{ticketsRemaining} restantes</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300 rounded-full",
              isLimitReached ? "bg-destructive/80" : "bg-primary/80",
            )}
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Countdown hasta el reset */}
      {nextResetDate && (
        <div className="pt-2 border-t border-border/30">
          <CountdownTimer
            targetDate={nextResetDate}
            showDays
            label="El límite se reinicia en:"
            onComplete={onLimitReset}
          />
        </div>
      )}
    </div>
  );
}
