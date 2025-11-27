"use client";

import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useDailyRewardsStore,
  useAvailableReward,
} from "@/store/useDailyRewardsStore";
import { DailyRewardCard, CountdownTimer } from "@/components/game/rewards";
import { useToast } from "@/hooks/useToast";
import { Gift, Loader2, Coins, Ticket, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RewardsPage() {
  const {
    rewards,
    playerStats,
    canClaim,
    nextClaimDate,
    isLoading,
    isClaiming,
    error,
    claimReward,
    fetchStatus,
  } = useDailyRewardsStore();

  const availableReward = useAvailableReward();
  const toast = useToast();

  // Refrescar datos al entrar a la página
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Manejar el claim
  const handleClaim = async () => {
    const success = await claimReward();

    if (success) {
      const claimed = useDailyRewardsStore.getState().lastClaimedReward;
      if (claimed) {
        const rewardText =
          claimed.type === "tickets"
            ? `${claimed.amount} ticket${claimed.amount > 1 ? "s" : ""}`
            : `${claimed.amount.toLocaleString()} monedas`;

        toast.success("¡Recompensa reclamada!", `Has recibido ${rewardText}`);
      }
    } else {
      toast.error("Error", error || "No se pudo reclamar la recompensa");
    }
  };

  // Cuando countdown termina
  const handleCountdownComplete = () => {
    fetchStatus();
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Card de Recompensas Diarias */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Gift className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Recompensas Diarias</CardTitle>
                <CardDescription>
                  ¡Vuelve cada día para reclamar tus premios! No rompas la
                  racha.
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {playerStats && (
                <div className="flex items-center gap-2">
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fetchStatus()}
                disabled={isLoading}
                className="shrink-0 cursor-pointer"
              >
                <RefreshCw
                  className={cn("h-4 w-4", isLoading && "animate-spin")}
                />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading && rewards.length === 0 ? (
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
              {/* Grid de cartas - más grande que en el modal */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
                {rewards.map((reward) => (
                  <DailyRewardCard key={reward.id} reward={reward} />
                ))}
              </div>

              {/* Sección de acción */}
              <div className="flex flex-col items-center gap-4 pt-4 border-t border-border/50">
                {canClaim && availableReward ? (
                  <>
                    <p className="text-sm text-muted-foreground text-center">
                      ¡Tu recompensa del{" "}
                      <span className="font-semibold text-foreground">
                        Día {availableReward.day}
                      </span>{" "}
                      está lista para ser reclamada!
                    </p>
                    <Button
                      size="lg"
                      onClick={handleClaim}
                      disabled={isClaiming}
                      className={cn(
                        "cursor-pointer min-w-[220px]",
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
                  <div className="flex flex-col items-center gap-3">
                    <CountdownTimer
                      targetDate={nextClaimDate}
                      onComplete={handleCountdownComplete}
                    />
                    <p className="text-xs text-muted-foreground text-center max-w-md">
                      Ya has reclamado tu recompensa de hoy. Vuelve mañana para
                      continuar tu racha y obtener mejores premios.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Placeholder para futuros sistemas de premios */}
      <Card className="border-dashed">
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Gift className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Más premios próximamente</p>
            <p className="text-sm mt-1">
              Nuevos sistemas de recompensas estarán disponibles pronto
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
