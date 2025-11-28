"use client";

import { Gift, Coins, Ticket, Package, History, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RouletteHistoryItem } from "@/types/reward";

interface SessionRewardsListProps {
  rewards: RouletteHistoryItem[];
  className?: string;
}

/**
 * Lista de premios ganados (historial)
 */
export function SessionRewardsList({
  rewards,
  className,
}: SessionRewardsListProps) {
  const getRewardIcon = (item: RouletteHistoryItem) => {
    if (!item.reward) return <Gift className="h-4 w-4 text-muted-foreground" />;

    switch (item.reward.typeReward) {
      case "currency":
        return item.reward.name.toLowerCase().includes("coin") ? (
          <Coins className="h-4 w-4 text-amber-500" />
        ) : (
          <Ticket className="h-4 w-4 text-blue-500" />
        );
      case "consumable":
        return <Package className="h-4 w-4 text-green-500" />;
      case "cosmetic":
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      default:
        return <Gift className="h-4 w-4 text-primary" />;
    }
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString("es", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (isToday) {
      return { date: "Hoy", time };
    }

    if (isYesterday) {
      return { date: "Ayer", time };
    }

    const dateStr = date.toLocaleDateString("es", {
      day: "2-digit",
      month: "short",
    });

    return { date: dateStr, time };
  };

  const getRewardValue = (item: RouletteHistoryItem) => {
    if (!item.reward) return null;

    const quantity = item.reward.quantity;
    const value = item.reward.value;

    // Si el premio tiene cantidad, mostrarla
    if (quantity > 1) {
      return `x${quantity}`;
    }

    // Si tiene valor (ej: monedas), mostrarlo
    if (value > 0) {
      return `+${value}`;
    }

    return null;
  };

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historial de premios
          </div>
          {rewards.length > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              {rewards.length} {rewards.length === 1 ? "premio" : "premios"}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rewards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Aún no has ganado premios
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ¡Gira la ruleta para empezar!
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {rewards.map((item) => {
              const { date, time } = formatDateTime(item.timestamp);
              const rewardValue = getRewardValue(item);

              return (
                <div
                  key={item.uuid}
                  className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/40 transition-colors"
                >
                  <div className="shrink-0 mt-0.5">{getRewardIcon(item)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium truncate">
                        {item.reward?.name || "Premio"}
                      </p>
                      {rewardValue && (
                        <span className="text-xs font-semibold text-primary shrink-0">
                          {rewardValue}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{date}</span>
                      <span className="text-muted-foreground/50">•</span>
                      <span>{time}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
