"use client";

import { useEffect, useState, ReactNode } from "react";
import {
  useDailyRewardsStore,
  useAvailableReward,
} from "@/store/useDailyRewardsStore";
import { DailyRewardCard, CountdownTimer } from "@/components/game/rewards";
import { GridContainer } from "@/components/ui/GridContainer";
import { useToast } from "@/hooks/useToast";
import { Gift } from "lucide-react";
import { CardHeaderSticky } from "@/components/ui/CardHeaderSticky";

export default function DailyRewardsPage() {
  const { rewards, isLoading, error, claimReward, fetchStatus } =
    useDailyRewardsStore();
  const canClaimDailyReward = useDailyRewardsStore((state) => state.canClaim);
  const nextClaimDate = useDailyRewardsStore((state) => state.nextClaimDate);
  const availableReward = useAvailableReward();

  const [claimingRewardId, setClaimingRewardId] = useState<number | null>(null);

  const toast = useToast();

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleClaim = async (rewardId: number) => {
    setClaimingRewardId(rewardId);
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

    setClaimingRewardId(null);
  };

  const handleCountdownComplete = () => {
    // Refrescar estado cuando el countdown termine
    useDailyRewardsStore.getState().fetchStatus();
  };

  // Título y subtítulo dinámicos para daily rewards
  let subtitle = "";
  let headerAction: ReactNode = null;

  if (canClaimDailyReward && availableReward) {
    subtitle = `¡Tu recompensa del Día ${availableReward.day} está lista para ser reclamada!`;
  } else if (nextClaimDate) {
    subtitle = "Ya has reclamado tu recompensa de hoy.";
    headerAction = (
      <CountdownTimer
        targetDate={nextClaimDate}
        onComplete={handleCountdownComplete}
        className=""
      />
    );
  } else {
    subtitle =
      "¡Completaste la racha de 7 días! Has reclamado todas las recompensas.";
  }

  return (
    <div className="flex flex-col h-full">
      <CardHeaderSticky title="Recompensas Diarias" />

      <div className="flex flex-col flex-1 space-y-4 overflow-y-auto">
        {/* Info de estado y countdown arriba del grid */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 sm:px-6 sm:py-3">
          <p className="text-sm text-muted-foreground">{subtitle}</p>
          {headerAction}
        </div>

        {/* Grid de recompensas - 100% ancho */}
        <div className="flex-1">
          <GridContainer
            isLoading={isLoading}
            emptyMessage="No hay recompensas disponibles"
            emptyIcon={Gift}
            padding=""
            spacing=""
            gridCols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            gap="gap-2"
          >
            {rewards.map((reward, index) => (
              <DailyRewardCard
                key={reward.id}
                reward={reward}
                isSpecial={index === 6}
                onClaim={() => handleClaim(reward.id)}
                isClaiming={claimingRewardId === reward.id}
              />
            ))}
          </GridContainer>
        </div>
      </div>
    </div>
  );
}
