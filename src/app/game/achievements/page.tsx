"use client";

import { AchievementsList } from "@/components/game/achievements";
import { CardHeaderSticky } from "@/components/ui/CardHeaderSticky";
import { ContentLoading } from "@/components/ui/ContentLoading";
import { useAchievementsStore } from "@/store/useAchievementsStore";

export default function AchievementsPage() {
  const { availableCount, isLoading, achievements } = useAchievementsStore();

  // Subtítulo dinámico según logros disponibles
  const subtitle =
    availableCount > 0
      ? `¡Tienes ${availableCount} logro${
          availableCount > 1 ? "s" : ""
        } disponible${availableCount > 1 ? "s" : ""} para reclamar!`
      : "Completa desafíos y obtén recompensas";

  return (
    <div className="flex flex-col h-full">
      <CardHeaderSticky title="Logros" />

      <div className="flex-1 p-4 space-y-4">
        {isLoading && achievements.length === 0 && (
          <ContentLoading message="Cargando logros..." />
        )}

        {/* Info de logros disponibles */}
        <div>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {/* Lista de logros */}
        <div className="flex-1">
          <AchievementsList />
        </div>
      </div>
    </div>
  );
}
