"use client";

import { UserTransactionHistory } from "@/types/transaction";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Coins, Ticket } from "lucide-react";

interface TransactionHistoryTableProps {
  data: UserTransactionHistory[];
  isLoading?: boolean;
  error?: string;
}

const statusLabels = {
  pending: "Pendiente",
  in_progress: "En progreso",
  completed: "Completado",
  cancelled: "Cancelado",
};

const statusVariants = {
  pending: "secondary",
  in_progress: "default",
  completed: "outline",
  cancelled: "destructive",
} as const;

const typeLabels: Record<string, string> = {
  coins_to_tickets: "Canje a Tickets",
  coins_to_tokens: "Canje a Tokens",
  daily_reward: "Recompensa Diaria",
  achievement_reward: "Recompensa de Logro",
  level_reward: "Recompensa de Nivel",
};

export function TransactionHistoryTable({
  data,
  isLoading,
  error,
}: TransactionHistoryTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <ArrowRight className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">
          No se encontraron transacciones
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-3 font-medium">Tipo</th>
            <th className="text-center p-3 font-medium">Desde</th>
            <th className="text-center p-3 font-medium hidden sm:table-cell">
              {/* Flecha */}
            </th>
            <th className="text-center p-3 font-medium">Hacia</th>
            <th className="text-center p-3 font-medium hidden md:table-cell">
              Tasa
            </th>
            <th className="text-center p-3 font-medium">Estado</th>
            <th className="text-center p-3 font-medium hidden lg:table-cell">
              Fecha
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((transaction) => (
            <tr key={transaction.uuid} className="border-t hover:bg-muted/20">
              {/* Tipo */}
              <td className="p-3">
                <span className="text-xs font-medium">
                  {typeLabels[transaction.transactionType] ||
                    transaction.transactionType
                      .split("_")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1),
                      )
                      .join(" ")}
                </span>
              </td>

              {/* Desde */}
              <td className="p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">
                    {transaction.coinsExchanged.toLocaleString()}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground block mt-0.5">
                  {transaction.currency}
                </span>
              </td>

              {/* Flecha */}
              <td className="p-3 text-center hidden sm:table-cell">
                <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto" />
              </td>

              {/* Hacia */}
              <td className="p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  {transaction.transactionType === "coins_to_tickets" ? (
                    <Ticket className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Coins className="h-4 w-4 text-purple-500" />
                  )}
                  <span className="font-medium">
                    {transaction.amountDelivered.toLocaleString()}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground block mt-0.5">
                  {transaction.transactionType === "coins_to_tickets"
                    ? "tickets"
                    : "tokens"}
                </span>
              </td>

              {/* Tasa */}
              <td className="p-3 text-center hidden md:table-cell">
                <span className="text-xs text-muted-foreground">
                  {transaction.coinsExchanged > 0 &&
                  transaction.amountDelivered > 0
                    ? `1:${Math.round(
                        transaction.coinsExchanged /
                          transaction.amountDelivered,
                      )}`
                    : "N/A"}
                </span>
              </td>

              {/* Estado */}
              <td className="p-3 text-center">
                <Badge
                  variant={statusVariants[transaction.statusTransaction]}
                  className="text-xs"
                >
                  {statusLabels[transaction.statusTransaction]}
                </Badge>
              </td>

              {/* Fecha */}
              <td className="p-3 text-center hidden lg:table-cell">
                <span className="text-xs text-muted-foreground">
                  {new Date(transaction.executedAt).toLocaleDateString(
                    "es-ES",
                    {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
