"use client";

import { RewardCard } from "@/components/ui/RewardCard";
import { FALLBACK_IMAGES } from "@/constants";
import { Lock, Check, Gift, Loader2 } from "lucide-react";
import type { DailyReward } from "@/types/daily-rewards";

interface DailyRewardCardProps {
  reward: DailyReward;
  isSpecial?: boolean;
  onClaim?: () => void;
  isClaiming?: boolean;
}

/**
 * Tarjeta individual de recompensa diaria
 * Wrapper alrededor de RewardCard con lógica específica de daily rewards
 */
export function DailyRewardCard({
  reward,
  onClaim,
  isClaiming = false,
}: DailyRewardCardProps) {
  const { status, image, name } = reward;

  // Determinar texto e icono del botón según estado
  let buttonText = "Reclamar";
  let buttonIcon = Gift;

  if (isClaiming) {
    buttonText = "Reclamando...";
    buttonIcon = Loader2;
  } else if (status === "locked") {
    buttonText = "Bloqueado";
    buttonIcon = Lock;
  } else if (status === "claimed") {
    buttonText = "Reclamado";
    buttonIcon = Check;
  }

  return (
    <RewardCard
      name={name}
      image={image}
      fallbackImage={FALLBACK_IMAGES.reward}
      status={status}
      buttonText={buttonText}
      buttonIcon={buttonIcon}
      onAction={status === "available" ? onClaim : undefined}
      isLoading={isClaiming}
      disabled={status !== "available" || !onClaim}
    />
  );
}
