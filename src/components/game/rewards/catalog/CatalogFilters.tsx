"use client";

import { Coins, Ticket, Package, Sparkles, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CatalogFilterType } from "@/store/useCatalogStore";

interface CatalogFiltersProps {
  activeFilter: CatalogFilterType;
  onFilterChange: (filter: CatalogFilterType) => void;
  className?: string;
}

const filters: {
  value: CatalogFilterType;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "all", label: "Todos", icon: <LayoutGrid className="h-4 w-4" /> },
  { value: "coins", label: "Monedas", icon: <Coins className="h-4 w-4" /> },
  { value: "tickets", label: "Tickets", icon: <Ticket className="h-4 w-4" /> },
  {
    value: "consumable",
    label: "Consumibles",
    icon: <Package className="h-4 w-4" />,
  },
  {
    value: "cosmetic",
    label: "Cosméticos",
    icon: <Sparkles className="h-4 w-4" />,
  },
];

export function CatalogFilters({
  activeFilter,
  onFilterChange,
  className,
}: CatalogFiltersProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={activeFilter === filter.value ? "default" : "outline"}
          size="sm"
          onClick={() => onFilterChange(filter.value)}
          className="gap-2"
        >
          {filter.icon}
          {filter.label}
        </Button>
      ))}
    </div>
  );
}
