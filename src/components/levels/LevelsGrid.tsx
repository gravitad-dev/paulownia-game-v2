"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [isSmallGrid, setIsSmallGrid] = useState(false);

  // Detectar si el viewport muestra 3 columnas o menos (xl: 1280px es 4 cols)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(max-width: 1279px)");
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsSmallGrid(event.matches);
    };

    // Estado inicial
    handleChange(mediaQuery);

    // Suscribir cambios
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      // Compatibilidad Safari (API antigua)
      (mediaQuery as MediaQueryList & {
        addListener: (listener: (event: MediaQueryListEvent | MediaQueryList) => void) => void;
      }).addListener(handleChange);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        // Compatibilidad Safari (API antigua)
        (mediaQuery as MediaQueryList & {
          removeListener: (listener: (event: MediaQueryListEvent | MediaQueryList) => void) => void;
        }).removeListener(handleChange);
      }
    };
  }, []);

  const visibleLevels = useMemo(
    () => (isSmallGrid ? userLevels.slice(0, 6) : userLevels),
    [isSmallGrid, userLevels]
  );

  const targetSlots = isSmallGrid ? 6 : 8;
  const skeletonCount = Math.max(0, targetSlots - visibleLevels.length);

  if (userLevels.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No hay niveles disponibles en este momento.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
      {visibleLevels.map((userLevel) => (
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
