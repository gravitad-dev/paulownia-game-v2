"use client";

import { Level } from "@/types/level";
import { LevelCard } from "./LevelCard";

interface LevelsGridProps {
  levels: Level[];
  isLoading?: boolean;
}

export function LevelsGrid({ levels, isLoading }: LevelsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-64 bg-muted animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (levels.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No hay niveles disponibles en este momento.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {levels.map((level) => (
        <LevelCard key={level.uuid} level={level} />
      ))}
    </div>
  );
}
