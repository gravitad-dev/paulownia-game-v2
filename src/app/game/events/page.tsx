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
import { Gift, Loader2, RefreshCw, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EventsPage() {
  const {
    rewards,
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

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

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

  const handleCountdownComplete = () => {
    fetchStatus();
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Daily Rewards */}
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchStatus()}
              disabled={isLoading}
              className="shrink-0 cursor-pointer self-end lg:self-auto"
            >
              <RefreshCw
                className={cn("h-4 w-4", isLoading && "animate-spin")}
              />
            </Button>
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
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                {rewards.map((reward) => (
                  <DailyRewardCard key={reward.id} reward={reward} />
                ))}
              </div>

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
                    {nextClaimDate ? (
                      <>
                        <CountdownTimer
                          targetDate={nextClaimDate}
                          onComplete={handleCountdownComplete}
                        />
                        <p className="text-xs text-muted-foreground text-center max-w-md">
                          Ya has reclamado tu recompensa de hoy. Vuelve mañana
                          para continuar tu racha y obtener mejores premios.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-foreground">
                          ¡Completaste la racha de 7 días!
                        </p>
                        <p className="text-xs text-muted-foreground text-center max-w-md">
                          Has reclamado todas las recompensas disponibles.
                          ¡Felicitaciones!
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Próximos eventos */}
      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Próximos Eventos</CardTitle>
              <CardDescription>
                Eventos especiales y torneos por venir
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Próximamente</p>
            <p className="text-sm mt-1">
              Nuevos eventos y torneos estarán disponibles pronto
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
