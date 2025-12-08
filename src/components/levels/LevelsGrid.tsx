"use client";

import { UserLevel } from "@/types/user-level";
import { LevelCard } from "./LevelCard";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LevelsGridProps {
  userLevels: UserLevel[];
  isLoading?: boolean;
  onUnlockSuccess?: () => void;
}

export function LevelsGrid({
  userLevels,
  isLoading,
  onUnlockSuccess,
}: LevelsGridProps) {
  if (userLevels.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No hay niveles disponibles en este momento.
        </p>
      </div>
    );
  }

  // Calcular cuántas skeleton cards se necesitan para llegar a 8
  const skeletonCount = Math.max(0, 8 - userLevels.length);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
      {userLevels.map((userLevel) => (
        <LevelCard
          key={userLevel.uuid}
          userLevel={userLevel}
          onUnlockSuccess={onUnlockSuccess}
        />
      ))}
      {skeletonCount > 0 &&
        [...Array(skeletonCount)].map((_, i) => (
          <Card
            key={`skeleton-${i}`}
            data-level-card
            className={cn(
              "h-full shadow-none min-h-[260px] border border-solid border-muted-foreground/20"
            )}
          />
        ))}
    </div>
  );
}
