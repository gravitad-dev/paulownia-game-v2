"use client";

import { Clock, Ticket, Coins, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ExchangeHistoryItem } from "@/types/exchange";

interface ExchangeHistoryProps {
  history: ExchangeHistoryItem[];
  className?: string;
}

/**
 * Formatea una fecha ISO a formato legible
 */
const formatDate = (isoDate: string): string => {
  const date = new Date(isoDate);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const timeStr = date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) {
    return `Hoy, ${timeStr}`;
  }

  const dateStr = date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });

  return `${dateStr}, ${timeStr}`;
};

/**
 * Muestra el historial de canjes recientes
 */
export function ExchangeHistory({ history, className }: ExchangeHistoryProps) {
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Historial reciente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!history || history.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>No hay canjes recientes</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2">
            {history.map((item, index) => (
              <div
                key={`${item.executedAt}-${index}`}
                className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg text-sm"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Ticket className="h-3.5 w-3.5 text-primary" />
                      <span className="font-medium">
                        {item.amountDelivered}{" "}
                        {item.amountDelivered === 1 ? "ticket" : "tickets"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(item.executedAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Coins className="h-3.5 w-3.5" />
                  <span className="font-medium">
                    -{item.coinsExchanged.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
