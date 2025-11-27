"use client";

import { cn } from "@/lib/utils";
import { CoinsBadge } from "./CoinsBadge";
import { TicketsBadge } from "./TicketsBadge";

type BadgeVariant = "default" | "outline";
type BadgeSize = "sm" | "md" | "lg";

interface PlayerStats {
  coins: number;
  tickets: number;
}

interface PlayerStatsBadgesProps {
  stats: PlayerStats;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  showCoins?: boolean;
  showTickets?: boolean;
}

/**
 * Componente que muestra los badges de monedas y tickets del jugador
 */
export function PlayerStatsBadges({
  stats,
  variant = "default",
  size = "md",
  className,
  showCoins = true,
  showTickets = true,
}: PlayerStatsBadgesProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showCoins && (
        <CoinsBadge amount={stats.coins} variant={variant} size={size} />
      )}
      {showTickets && (
        <TicketsBadge amount={stats.tickets} variant={variant} size={size} />
      )}
    </div>
  );
}
