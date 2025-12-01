"use client";

import { AchievementsList } from "@/components/game/achievements";
import { CardHeaderSticky } from "@/components/ui/CardHeaderSticky";
import { useAchievementsStore } from "@/store/useAchievementsStore";

export default function AchievementsPage() {
  const { availableCount } = useAchievementsStore();

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

      <div className="flex flex-col flex-1 space-y-4 overflow-y-auto">
        {/* Info de logros disponibles */}
        <div className="px-4 py-3 sm:px-6 sm:py-3">
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {/* Lista de logros */}
        <div className="flex-1 px-4 sm:px-6">
          <AchievementsList />
        </div>
      </div>
    </div>
  );
}
