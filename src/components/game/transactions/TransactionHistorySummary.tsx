"use client";

import { UserTransactionHistory, TransactionType } from "@/types/transaction";

interface TransactionHistorySummaryProps {
  transactions: UserTransactionHistory[];
  selectedType: TransactionType | "all";
}

export function TransactionHistorySummary({
  transactions,
}: TransactionHistorySummaryProps) {
  const total = transactions.length;
  const totalCoinsSpent = transactions
    .filter((t) => t.statusTransaction === "completed")
    .reduce((sum, t) => sum + t.coinsExchanged, 0);

  // Calcular lo recibido según el tipo de transacción
  const ticketsReceived = transactions
    .filter(
      (t) =>
        t.statusTransaction === "completed" &&
        t.transactionType === "coins_to_tickets",
    )
    .reduce((sum, t) => sum + t.amountDelivered, 0);

  const tokensReceived = transactions
    .filter(
      (t) =>
        t.statusTransaction === "completed" &&
        t.transactionType === "coins_to_tokens",
    )
    .reduce((sum, t) => sum + t.amountDelivered, 0);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="relative overflow-hidden rounded-2xl border border-purple-400/60 bg-linear-to-br from-purple-500/15 via-purple-400/10 to-purple-300/20 px-4 py-3 shadow-sm">
        <div className="pointer-events-none absolute -right-3 -top-3 h-12 w-12 rounded-full bg-purple-300/30 blur-xl" />
        <p className="text-[11px] font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-200">
          Total canjes
        </p>
        <p className="mt-1 text-2xl font-extrabold text-purple-700 dark:text-purple-200 drop-shadow-[0_1px_0_rgba(0,0,0,0.25)]">
          {total}
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-amber-400/60 bg-linear-to-br from-amber-500/15 via-amber-400/10 to-amber-300/20 px-4 py-3 shadow-sm">
        <div className="pointer-events-none absolute -left-3 -top-3 h-12 w-12 rounded-full bg-amber-300/30 blur-xl" />
        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-100">
          Monedas gastadas
        </p>
        <p className="mt-1 text-2xl font-extrabold text-amber-700 dark:text-amber-100 drop-shadow-[0_1px_0_rgba(0,0,0,0.25)]">
          {totalCoinsSpent.toLocaleString()}
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-sky-400/60 bg-linear-to-br from-sky-500/15 via-sky-400/10 to-sky-300/20 px-4 py-3 shadow-sm">
        <div className="pointer-events-none absolute -right-4 top-2 h-10 w-10 rounded-full bg-sky-300/40 blur-xl" />
        <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-200">
          Tickets
        </p>
        <p className="mt-1 text-2xl font-extrabold text-sky-700 dark:text-sky-200 drop-shadow-[0_1px_0_rgba(0,0,0,0.25)]">
          {ticketsReceived.toLocaleString()}
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-purple-400/60 bg-linear-to-br from-purple-500/15 via-purple-400/10 to-purple-300/20 px-4 py-3 shadow-sm">
        <div className="pointer-events-none absolute -left-4 bottom-2 h-10 w-10 rounded-full bg-purple-300/40 blur-xl" />
        <p className="text-[11px] font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-200">
          Tokens
        </p>
        <p className="mt-1 text-2xl font-extrabold text-purple-700 dark:text-purple-200 drop-shadow-[0_1px_0_rgba(0,0,0,0.25)]">
          {tokensReceived.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
