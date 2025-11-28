"use client";

import { Coins, Ticket, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExchangeRateInfoProps {
  rate: number;
  className?: string;
}

/**
 * Muestra la tasa de cambio actual: X monedas = 1 ticket
 */
export function ExchangeRateInfo({ rate, className }: ExchangeRateInfoProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-3 py-3 px-4 bg-muted/30 rounded-lg border border-border/50",
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <Coins className="h-4 w-4 text-amber-500" />
        <span className="font-semibold">{rate.toLocaleString()}</span>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
      <div className="flex items-center gap-1.5">
        <Ticket className="h-4 w-4 text-primary" />
        <span className="font-semibold">1</span>
      </div>
    </div>
  );
}
