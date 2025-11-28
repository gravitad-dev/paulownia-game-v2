"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { RewardCard } from "@/components/ui/RewardCard";
import { AchievementProgressBar } from "./AchievementProgressBar";
import {
  Coins,
  Ticket,
  Lock,
  Check,
  Gift,
  Trophy,
  Target,
  Clock,
  Gamepad2,
  Calendar,
  Sparkles,
  Loader2,
} from "lucide-react";
import type { Achievement, TargetType, RewardType } from "@/types/achievements";

interface AchievementCardProps {
  achievement: Achievement;
  onClaim?: (uuid: string) => Promise<boolean>;
  isClaiming?: boolean;
}

/**
 * Icono según el tipo de recompensa
 */
const RewardIcon = ({
  type,
  className,
}: {
  type: RewardType;
  className?: string;
}) => {
  if (type === "tickets") {
    return <Ticket className={cn("h-4 w-4", className)} />;
  }
  return <Coins className={cn("h-4 w-4", className)} />;
};

/**
 * Icono según el tipo de objetivo
 */
const TargetIcon = ({
  type,
  className,
}: {
  type: TargetType;
  className?: string;
}) => {
  const icons: Record<TargetType, React.ReactNode> = {
    score: <Target className={cn("h-5 w-5", className)} />,
    gamesWon: <Trophy className={cn("h-5 w-5", className)} />,
    dailyLogin: <Calendar className={cn("h-5 w-5", className)} />,
    xp: <Sparkles className={cn("h-5 w-5", className)} />,
    time: <Clock className={cn("h-5 w-5", className)} />,
  };

  return icons[type] || <Gamepad2 className={cn("h-5 w-5", className)} />;
};

/**
 * Tarjeta individual de logro
 * Muestra diferentes estados: locked, available, claimed
 */
export function AchievementCard({
  achievement,
  onClaim,
  isClaiming = false,
}: AchievementCardProps) {
  const [isClaimingThis, setIsClaimingThis] = useState(false);
  const {
    uuid,
    title,
    description,
    status,
    currentProgress,
    goalAmount,
    rewardType,
    rewardAmount,
    image,
    targetType,
  } = achievement;

  const handleClaim = async () => {
    if (!onClaim || status !== "completed" || isClaimingThis) return;
    setIsClaimingThis(true);
    try {
      await onClaim(uuid);
    } finally {
      setIsClaimingThis(false);
    }
  };

  // Determinar texto e icono del botón según estado
  let buttonText = "Reclamar";
  let buttonIcon = Gift;

  if (isClaimingThis || isClaiming) {
    buttonText = "Reclamando...";
    buttonIcon = Loader2;
  } else if (status === "locked") {
    buttonText = "Bloqueado";
    buttonIcon = Lock;
  } else if (status === "claimed") {
    buttonText = "Reclamado";
    buttonIcon = Check;
  }

  // Fallback image based on target type if no image is provided
  // This is optional, we could just let RewardCard use its default
  // or we could map targetType to specific images.
  // For now we'll rely on the default or the provided image.

  return (
    <RewardCard
      name={title}
      image={image ? { url: image } : null} // Achievement image is string | null, RewardCard expects { url: string } | null. Wait, let's check types.
      status={status}
      buttonText={buttonText}
      buttonIcon={buttonIcon}
      onAction={status === "completed" ? handleClaim : undefined}
      isLoading={isClaimingThis}
      disabled={status !== "completed" || isClaiming}
      className="h-full"
    >
      <div className="space-y-3">
        {/* Reward Badge */}
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap w-fit",
              status === "locked"
                ? "bg-muted/50 text-muted-foreground"
                : status === "claimed"
                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-primary/20 text-primary",
            )}
          >
            <RewardIcon type={rewardType} className="h-3 w-3" />
            <span>{rewardAmount}</span>
          </div>
          
          {/* Target Icon */}
           <div className="text-muted-foreground">
             <TargetIcon type={targetType} className="h-4 w-4" />
           </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
          {description}
        </p>

        {/* Progress Bar */}
        <AchievementProgressBar
          currentProgress={currentProgress}
          goalAmount={goalAmount}
          status={status}
        />
      </div>
    </RewardCard>
  );
}
