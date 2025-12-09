"use client";

import { UserTransactionHistory } from "@/types/transaction";
import { Badge } from "@/components/ui/badge";
import { StandardTable } from "@/components/ui/StandardTable";
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
  return (
    <StandardTable
      headers={[
        { key: "type", label: "Tipo", align: "left" },
        { key: "from", label: "Desde", align: "center" },
        { key: "arrow", label: "", align: "center", className: "hidden sm:table-cell" },
        { key: "to", label: "Hacia", align: "center" },
        { key: "rate", label: "Tasa", align: "center", className: "hidden md:table-cell" },
        { key: "status", label: "Estado", align: "center" },
        { key: "date", label: "Fecha", align: "center", className: "hidden lg:table-cell" },
      ]}
      rows={data || []}
      isLoading={isLoading}
      error={error}
      minRows={5}
      emptyState={
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ArrowRight className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No se encontraron transacciones
          </p>
        </div>
      }
      renderRow={(transaction) => (
        <tr key={transaction.uuid} className="border-t hover:bg-muted/20">
          <td className="p-3">
            <span className="text-xs font-medium">
              {typeLabels[transaction.transactionType] ||
                transaction.transactionType
                  .split("_")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}
            </span>
          </td>
          <td className="p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">
                {transaction.coinsExchanged.toLocaleString()}
              </span>
            </div>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {transaction.currency}
            </span>
          </td>
          <td className="hidden p-3 text-center sm:table-cell">
            <ArrowRight className="mx-auto h-4 w-4 text-muted-foreground" />
          </td>
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
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {transaction.transactionType === "coins_to_tickets"
                ? "tickets"
                : "tokens"}
            </span>
          </td>
          <td className="hidden p-3 text-center md:table-cell">
            <span className="text-xs text-muted-foreground">
              {transaction.coinsExchanged > 0 && transaction.amountDelivered > 0
                ? `1:${Math.round(
                    transaction.coinsExchanged / transaction.amountDelivered,
                  )}`
                : "N/A"}
            </span>
          </td>
          <td className="p-3 text-center">
            <Badge
              variant={statusVariants[transaction.statusTransaction]}
              className="text-xs"
            >
              {statusLabels[transaction.statusTransaction]}
            </Badge>
          </td>
          <td className="hidden p-3 text-center lg:table-cell">
            <span className="text-xs text-muted-foreground">
              {new Date(transaction.executedAt).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </td>
        </tr>
      )}
    />
  );
}
