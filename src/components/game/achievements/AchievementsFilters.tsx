"use client";

import { AchievementStatus } from "@/types/achievements";
import { Button } from "@/components/ui/button";

interface AchievementsFiltersProps {
  selectedStatus: AchievementStatus | "all";
  onStatusChange: (status: AchievementStatus | "all") => void;
}

export function AchievementsFilters({
  selectedStatus,
  onStatusChange,
}: AchievementsFiltersProps) {
  const filters: { label: string; value: AchievementStatus | "all" }[] = [
    { label: "Todos", value: "all" },
    { label: "Bloqueados", value: "locked" },
    { label: "Completados", value: "completed" },
    { label: "Reclamados", value: "claimed" },
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
