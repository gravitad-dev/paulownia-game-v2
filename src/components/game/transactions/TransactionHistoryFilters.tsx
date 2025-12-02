"use client";

import { TransactionType } from "@/types/transaction";
import { Button } from "@/components/ui/button";

interface TransactionHistoryFiltersProps {
  selectedType: TransactionType | "all";
  onTypeChange: (type: TransactionType | "all") => void;
}

export function TransactionHistoryFilters({
  selectedType,
  onTypeChange,
}: TransactionHistoryFiltersProps) {
  const typeFilters: { label: string; value: TransactionType | "all" }[] = [
    { label: "Todos los tipos", value: "all" },
    { label: "Monedas → Tickets", value: "coins_to_tickets" },
    { label: "Monedas → Tokens", value: "coins_to_tokens" },
  ];

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">Tipo de canje:</p>
      <div className="flex flex-wrap gap-2">
        {typeFilters.map((filter) => (
          <Button
            key={filter.value}
            variant={selectedType === filter.value ? "default" : "outline"}
            size="sm"
            onClick={() => onTypeChange(filter.value)}
            className="text-xs"
          >
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
