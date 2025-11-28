"use client";

import { useEffect, useCallback, useState } from "react";
import { AlertCircle } from "lucide-react";
import { usePlayerStatsStore } from "@/store/usePlayerStatsStore";
import { useRewardStore } from "@/store/useRewardStore";
import { RewardService } from "@/services/reward.service";
import { useToast } from "@/hooks/useToast";
import type { RouletteHistoryItem } from "@/types/reward";
import {
  SpinnerAnimation,
  SpinButton,
  RewardRevealModal,
  SessionRewardsList,
} from "@/components/game/rewards/discover";

// Duración de la animación de la ruleta (en ms)
const SPIN_ANIMATION_DURATION = 3000;
// Delay antes de mostrar el modal de revelación (en ms)
const REVEAL_DELAY = 500;

export default function DiscoverRewardsPage() {
  const playerStats = usePlayerStatsStore((state) => state.stats);
  const {
    phase,
    currentReward,
    currentUserReward,
    error,
    spin,
    setPhase,
    clearCurrentReward,
    reset,
  } = useRewardStore();

  const [history, setHistory] = useState<RouletteHistoryItem[]>([]);

  const toast = useToast();

  // Cargar historial al montar y limpiar al salir
  useEffect(() => {
    const loadHistory = async () => {
      const data = await RewardService.getHistory();
      setHistory(data);
    };

    loadHistory();

    return () => reset();
  }, [reset]);

  // Mostrar errores
  useEffect(() => {
    if (error) {
      toast.error("Error", error);
    }
  }, [error, toast]);

  // Manejar el fin de la animación del spinner
  const handleSpinComplete = useCallback(() => {
    setPhase("revealing");

    // Pequeño delay antes de mostrar el modal
    setTimeout(() => {
      setPhase("revealed");
    }, REVEAL_DELAY);
  }, [setPhase]);

  // Manejar click en girar
  const handleSpin = async () => {
    const success = await spin();

    if (!success) {
      // El error ya se maneja en el store
      return;
    }

    // El estado ya está en "spinning", la animación comenzará
  };

  // Cerrar modal y volver a idle
  const handleCloseReveal = async () => {
    clearCurrentReward();

    // Recargar historial después de ganar un premio
    const data = await RewardService.getHistory();
    setHistory(data);
  };

  const ticketCount = playerStats?.tickets ?? 0;
  const isSpinning = phase === "spinning";
  const showRevealModal = phase === "revealed" && currentReward !== null;

  return (
    <div className="h-full p-4 sm:p-6 overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full max-w-6xl mx-auto">
        {/* Columna principal: Ruleta */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center">
          {/* Animación de la ruleta */}
          <SpinnerAnimation
            isSpinning={isSpinning}
            onSpinComplete={handleSpinComplete}
            duration={SPIN_ANIMATION_DURATION}
            className="mb-8"
          />

          {/* Botón para girar */}
          <SpinButton
            onClick={handleSpin}
            disabled={phase !== "idle"}
            isSpinning={isSpinning}
            ticketCount={ticketCount}
          />

          {/* Mensaje si no tiene tickets */}
          {ticketCount === 0 && phase === "idle" && (
            <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-dashed border-border text-center max-w-sm">
              <AlertCircle className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No tienes tickets disponibles.{" "}
                <span className="font-medium text-foreground">
                  Canjea tus monedas
                </span>{" "}
                para obtener tickets y poder girar la ruleta.
              </p>
            </div>
          )}
        </div>

        {/* Columna secundaria: Historial */}
        <div className="lg:col-span-4">
          <SessionRewardsList rewards={history} />
        </div>
      </div>

      {/* Modal de revelación del premio */}
      <RewardRevealModal
        open={showRevealModal}
        onOpenChange={(open) => !open && handleCloseReveal()}
        reward={currentReward}
        userReward={currentUserReward}
        onClose={handleCloseReveal}
      />
    </div>
  );
}
