"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import { useAchievementsStore } from "@/store/useAchievementsStore";
import { GridContainer } from "@/components/ui/GridContainer";
import { GlobalProgressBar } from "./GlobalProgressBar";
import { AlertCircle, RefreshCw, Trophy } from "lucide-react";
import { useEffect, useRef, useCallback } from "react";
import { AchievementCard } from "./AchievementCard";

interface AchievementsListProps {
  className?: string;
}

/**
 * Lista de logros con paginación
 */
export function AchievementsList({ className }: AchievementsListProps) {
  const {
    achievements,
    isLoading,
    isClaiming,
    error,
    lastClaimedAchievement,
    fetchAchievements,
    claimAchievement,
    clearLastClaimed,
  } = useAchievementsStore();

  const toast = useToast();
  const lastClaimedRef = useRef<string | null>(null);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  // Mostrar toast cuando se reclama un logro
  useEffect(() => {
    if (
      lastClaimedAchievement &&
      lastClaimedAchievement.uuid !== lastClaimedRef.current
    ) {
      lastClaimedRef.current = lastClaimedAchievement.uuid;
      const rewardText =
        lastClaimedAchievement.rewardType === "tickets"
          ? `${lastClaimedAchievement.rewardAmount} ticket${
              lastClaimedAchievement.rewardAmount > 1 ? "s" : ""
            }`
          : `${lastClaimedAchievement.rewardAmount} monedas`;

      toast.success(
        `¡${lastClaimedAchievement.title} completado!`,
        `Has ganado ${rewardText}`,
      );
      clearLastClaimed();
    }
  }, [lastClaimedAchievement, toast, clearLastClaimed]);

  // Handler de reclamo con manejo de errores
  const handleClaimAchievement = useCallback(
    async (uuid: string): Promise<boolean> => {
      const success = await claimAchievement(uuid);

      if (!success) {
        // Obtener el error del store
        const { error: claimError } = useAchievementsStore.getState();
        toast.error(
          "Error al reclamar",
          claimError || "No se pudo reclamar el logro",
        );
        // Refrescar logros por si el estado cambió
        fetchAchievements();
      }
      // Si fue exitoso, claimAchievement ya actualizó el playerStatsStore

      return success;
    },
    [claimAchievement, toast, fetchAchievements],
  );

  // Ordenar: disponibles primero, luego por progreso descendente
  const sortedAchievements = [...achievements].sort((a, b) => {
    // Primero los completados (listos para reclamar)
    if (a.status === "completed" && b.status !== "completed") return -1;
    if (b.status === "completed" && a.status !== "completed") return 1;

    // Luego los bloqueados (por progreso)
    if (a.status === "locked" && b.status === "locked") {
      const progressA = a.currentProgress / a.goalAmount;
      const progressB = b.currentProgress / b.goalAmount;
      return progressB - progressA;
    }

    // Finalmente los reclamados
    if (a.status === "claimed" && b.status !== "claimed") return 1;
    if (b.status === "claimed" && a.status !== "claimed") return -1;

    return 0;
  });

  const averagePercentage =
    achievements.length > 0
      ? (() => {
          const sumPercents = achievements.reduce((sum, a) => {
            const goal = a.goalAmount > 0 ? a.goalAmount : 0;
            const progressClamped =
              goal > 0 ? Math.min(a.currentProgress, goal) : 0;
            const percent = goal > 0 ? (progressClamped / goal) * 100 : 0;
            return sum + percent;
          }, 0);
          const raw = sumPercents / achievements.length;
          const allComplete = achievements.every(
            (a) => a.goalAmount > 0 && a.currentProgress >= a.goalAmount,
          );
          if (allComplete) return 100;
          if (raw > 0 && raw < 1) return 1;
          return Math.floor(raw);
        })()
      : 0;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground text-center">{error}</p>
        <Button variant="outline" onClick={() => fetchAchievements()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Progreso Global */}
      {!isLoading && achievements.length > 0 && (
        <GlobalProgressBar averagePercentage={averagePercentage} />
      )}

      {/* Grid de logros */}
      <GridContainer
        isLoading={isLoading}
        gridCols="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4"
        padding="p-0"
        spacing="space-y-0"
        emptyMessage="No hay logros disponibles"
        emptyIcon={Trophy}
      >
        {sortedAchievements.map((achievement) => (
          <AchievementCard
            key={achievement.uuid}
            achievement={achievement}
            onClaim={handleClaimAchievement}
            isClaiming={isClaiming}
          />
        ))}
      </GridContainer>
    </div>
  );
}
