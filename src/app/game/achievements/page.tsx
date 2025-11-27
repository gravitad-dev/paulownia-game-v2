"use client";

import { AchievementsList } from "@/components/game/achievements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAchievementsStore } from "@/store/useAchievementsStore";
import { Trophy } from "lucide-react";

export default function AchievementsPage() {
  const { availableCount } = useAchievementsStore();

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Logros</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Completa desafíos y obtén recompensas
              </p>
            </div>
          </div>

          {/* Indicador de logros disponibles */}
          {availableCount > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm text-primary font-medium">
                ¡Tienes {availableCount} logro{availableCount > 1 ? "s" : ""}{" "}
                disponible{availableCount > 1 ? "s" : ""} para reclamar!
              </p>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <AchievementsList />
        </CardContent>
      </Card>
    </div>
  );
}
