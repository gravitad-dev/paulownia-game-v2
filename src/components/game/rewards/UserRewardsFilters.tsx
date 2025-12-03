"use client";

import { RewardStatus } from "@/types/reward";
import { Button } from "@/components/ui/button";

interface UserRewardsFiltersProps {
  selectedStatus: RewardStatus | "all";
  onStatusChange: (status: RewardStatus | "all") => void;
}

export function UserRewardsFilters({
  selectedStatus,
  onStatusChange,
}: UserRewardsFiltersProps) {
  const filters: { label: string; value: RewardStatus | "all" }[] = [
    { label: "Todos", value: "all" },
    { label: "Disponibles", value: "available" },
    { label: "En trámite", value: "in_claim" },
    { label: "Pendientes", value: "pending" },
    { label: "Entregados", value: "claimed" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={selectedStatus === filter.value ? "default" : "outline"}
          size="sm"
          onClick={() => onStatusChange(filter.value)}
          className="text-xs"
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}
