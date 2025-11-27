"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import { useAchievementsStore } from "@/store/useAchievementsStore";
import type { AchievementStatus } from "@/types/achievements";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Gift,
  List,
  Loader2,
  RefreshCw,
  Trophy,
} from "lucide-react";
import { useEffect, useRef, useCallback } from "react";
import { AchievementCard } from "./AchievementCard";

type FilterOption = AchievementStatus | "all";

interface FilterButton {
  value: FilterOption;
  label: string;
  icon: React.ReactNode;
}

const filterButtons: FilterButton[] = [
  { value: "all", label: "Todos", icon: <List className="h-4 w-4" /> },
  {
    value: "completed",
    label: "Disponibles",
    icon: <Gift className="h-4 w-4" />,
  },
  {
    value: "locked",
    label: "Bloqueados",
    icon: <Ban className="h-4 w-4" />,
  },
  {
    value: "claimed",
    label: "Reclamados",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
];

interface AchievementsListProps {
  className?: string;
}

/**
 * Lista de logros con filtros y paginación
 */
export function AchievementsList({ className }: AchievementsListProps) {
  const {
    achievements,
    isLoading,
    isClaiming,
    error,
    currentFilter,
    availableCount,
    lastClaimedAchievement,
    fetchAchievements,
    claimAchievement,
    setFilter,
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
      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {filterButtons.map((filter) => (
          <Button
            key={filter.value}
            variant={currentFilter === filter.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(filter.value)}
            className={cn(
              "gap-2",
              currentFilter === filter.value && "shadow-md",
            )}
          >
            {filter.icon}
            <span>{filter.label}</span>
            {filter.value === "completed" && availableCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary-foreground/20">
                {availableCount}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Estado de carga */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Lista vacía */}
      {!isLoading && sortedAchievements.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Trophy className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground text-center">
            {currentFilter === "all"
              ? "No hay logros disponibles"
              : currentFilter === "completed"
              ? "No tienes logros listos para reclamar"
              : currentFilter === "claimed"
              ? "Aún no has reclamado ningún logro"
              : "No hay logros bloqueados"}
          </p>
        </div>
      )}

      {/* Grid de logros */}
      {!isLoading && sortedAchievements.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedAchievements.map((achievement) => (
            <AchievementCard
              key={achievement.uuid}
              achievement={achievement}
              onClaim={handleClaimAchievement}
              isClaiming={isClaiming}
            />
          ))}
        </div>
      )}
    </div>
  );
}
