"use client";

import { useEffect, useState } from "react";
import { useDailyRewardsStore } from "@/store/useDailyRewardsStore";
import { DailyRewardCard } from "@/components/game/rewards";
import { GridContainer } from "@/components/ui/GridContainer";
import { useToast } from "@/hooks/useToast";
import { Gift } from "lucide-react";

export default function DailyRewardsPage() {
  const { rewards, isLoading, error, claimReward, fetchStatus } =
    useDailyRewardsStore();
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

  return (
    <GridContainer
      isLoading={isLoading}
      emptyMessage="No hay recompensas disponibles"
      emptyIcon={Gift}
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
  );
}
