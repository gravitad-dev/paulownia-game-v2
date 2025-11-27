"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  useDailyRewardsStore,
  useAvailableReward,
} from "@/store/useDailyRewardsStore";
import { useAuthStore } from "@/store/useAuthStore";
import { DailyRewardCard } from "./DailyRewardCard";
import { CountdownTimer } from "./CountdownTimer";
import { useToast } from "@/hooks/useToast";
import { Gift, Loader2, Coins, Ticket, X } from "lucide-react";
import { cn } from "@/lib/utils";
import gsap from "gsap";

/**
 * Modal de Recompensas Diarias
 * Muestra el grid de 7 días con el estado de cada recompensa
 * Se abre automáticamente cuando hay una recompensa disponible
 */
export function DailyRewardsModal() {
  const {
    rewards,
    playerStats,
    canClaim,
    nextClaimDate,
    isLoading,
    isClaiming,
    isModalOpen,
    closeModal,
    dismissModalForToday,
    claimReward,
    fetchStatus,
  } = useDailyRewardsStore();

  const { user } = useAuthStore();
  const availableReward = useAvailableReward();
  const toast = useToast();
  const cardsWrapperRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const [hasAnimated, setHasAnimated] = useState(false);

  // No mostrar el modal si estamos en la página de rewards (sería redundante)
  const isOnRewardsPage = pathname === "/game/rewards";
  const shouldShowModal = isModalOpen && !isOnRewardsPage;

  // Reset animación cuando el modal se cierra
  useEffect(() => {
    if (!shouldShowModal) {
      setHasAnimated(false);
    }
  }, [shouldShowModal]);

  // Animación de entrada de las cartas (solo una vez cuando se abre)
  useEffect(() => {
    if (
      !shouldShowModal ||
      !cardsWrapperRef.current ||
      rewards.length === 0 ||
      hasAnimated
    )
      return;

    const cards =
      cardsWrapperRef.current.querySelectorAll("[data-reward-card]");

    gsap.fromTo(
      cards,
      {
        opacity: 0,
        y: 20,
        scale: 0.9,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.4,
        stagger: 0.08,
        ease: "back.out(1.4)",
        delay: 0.2,
      },
    );

    setHasAnimated(true);
  }, [shouldShowModal, rewards.length, hasAnimated]);

  // Manejar el claim
  const handleClaim = async () => {
    const success = await claimReward();

    if (success) {
      // Obtener la recompensa recién reclamada del store
      // (claimReward ya actualizó rewards, playerStats, canClaim, etc.)
      const { lastClaimedReward } = useDailyRewardsStore.getState();

      // Mostrar toast de éxito
      if (lastClaimedReward) {
        const rewardText =
          lastClaimedReward.type === "tickets"
            ? `${lastClaimedReward.amount} ticket${
                lastClaimedReward.amount > 1 ? "s" : ""
              }`
            : `${lastClaimedReward.amount.toLocaleString()} monedas`;

        toast.success("¡Recompensa reclamada!", `Has recibido ${rewardText}`);
      }
    } else {
      toast.error("Error", "No se pudo reclamar la recompensa");
    }
  };

  // Manejar cuando el countdown termina (nueva recompensa disponible)
  const handleCountdownComplete = () => {
    fetchStatus();
  };

  // Cerrar con "Más tarde" (no mostrar de nuevo hoy para este usuario)
  const handleDismiss = () => {
    if (user?.id) {
      dismissModalForToday(user.id);
    } else {
      closeModal();
    }
  };

  return (
    <Dialog
      open={shouldShowModal}
      onOpenChange={(open) => {
        if (!open) {
          // Si hay recompensa reclamada disponible y cierra (Esc/overlay), considerar "Más tarde"
          if (canClaim && user?.id) {
            dismissModalForToday(user.id);
          } else {
            closeModal();
          }
        }
      }}
    >
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden p-0 border-none bg-background/95 backdrop-blur-xl">
        {/* Header */}
        <DialogHeader className="p-6 pb-2 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Gift className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  Recompensas Diarias
                </DialogTitle>
                <DialogDescription className="text-sm">
                  ¡Vuelve cada día para reclamar tus premios!
                </DialogDescription>
              </div>
            </div>

            {/* Stats del jugador */}
            {playerStats && (
              <div className="hidden sm:flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 rounded-full border border-amber-500/40">
                  <Coins className="h-4 w-4 text-amber-500" />
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {playerStats.coins.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/20 rounded-full border border-violet-500/40">
                  <Ticket className="h-4 w-4 text-violet-500" />
                  <span className="font-bold text-violet-600 dark:text-violet-400">
                    {playerStats.tickets}
                  </span>
                </div>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Contenido principal */}
        <div className="p-6 space-y-6 overflow-y-auto overflow-x-hidden max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : rewards.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay recompensas disponibles</p>
            </div>
          ) : (
            <>
              {/* Wrapper para animación */}
              <div ref={cardsWrapperRef}>
                {/* Flex con wrap para las cartas */}
                <div className="flex flex-wrap justify-center gap-4 sm:gap-5 gap-y-5 sm:gap-y-6 w-full">
                  {rewards.map((reward, index) => (
                    <div
                      key={reward.id}
                      data-reward-card
                      className={cn(
                        "w-[130px] sm:w-[150px]",
                        index === 6 && "w-40 sm:w-[200px]",
                      )}
                    >
                      <DailyRewardCard
                        reward={reward}
                        isSpecial={index === 6} // El día 7 es especial
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Sección de acción */}
              <div className="flex flex-col items-center gap-4 pt-2">
                {canClaim && availableReward ? (
                  <>
                    <p className="text-sm text-muted-foreground text-center">
                      ¡Tu recompensa del{" "}
                      <span className="font-semibold text-foreground">
                        Día {availableReward.day}
                      </span>{" "}
                      está lista!
                    </p>
                    <Button
                      size="lg"
                      onClick={handleClaim}
                      disabled={isClaiming}
                      className={cn(
                        "min-w-[200px] relative overflow-hidden cursor-pointer",
                        "bg-linear-to-r from-primary via-primary to-primary/90",
                        "hover:shadow-lg hover:shadow-primary/25 transition-all duration-300",
                      )}
                    >
                      {isClaiming ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Reclamando...
                        </>
                      ) : (
                        <>
                          <Gift className="h-4 w-4 mr-2" />
                          Reclamar Día {availableReward.day}
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    {nextClaimDate ? (
                      <>
                        <CountdownTimer
                          targetDate={nextClaimDate}
                          onComplete={handleCountdownComplete}
                        />
                        <p className="text-xs text-muted-foreground text-center max-w-sm">
                          Vuelve mañana para reclamar tu próxima recompensa. ¡No
                          rompas la racha!
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-foreground">
                          ¡Completaste la racha de 7 días!
                        </p>
                        <p className="text-xs text-muted-foreground text-center max-w-sm">
                          Has reclamado todas las recompensas. ¡Felicitaciones!
                        </p>
                      </>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer con botón de cerrar */}
        <div className="p-4 pt-0 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-4 w-4 mr-1.5" />
            {canClaim ? "Reclamar más tarde" : "Cerrar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
