"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  // Estilos según el estado
  const cardStyles = {
    locked: "bg-muted/20 border-muted-foreground/20 opacity-75",
    completed:
      "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/50 shadow-lg shadow-primary/10",
    claimed: "bg-emerald-500/10 border-emerald-500/30",
  };

  const iconContainerStyles = {
    locked: "bg-muted/50 text-muted-foreground/70",
    completed: "bg-primary text-primary-foreground shadow-lg shadow-primary/30",
    claimed: "bg-emerald-500 text-white",
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-md",
        cardStyles[status],
        status === "completed" && "hover:shadow-primary/20",
      )}
    >
      {/* Efecto de brillo para disponible */}
      {status === "completed" && (
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
      )}

      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Icono del logro */}
          <div
            className={cn(
              "shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
              iconContainerStyles[status],
            )}
          >
            {status === "locked" ? (
              <Lock className="h-5 w-5" />
            ) : status === "claimed" ? (
              <Check className="h-5 w-5" />
            ) : (
              <TargetIcon type={targetType} />
            )}
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            {/* Título y recompensa */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3
                className={cn(
                  "font-semibold text-sm line-clamp-1",
                  status === "locked"
                    ? "text-muted-foreground"
                    : status === "claimed"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-foreground",
                )}
              >
                {title}
              </h3>

              {/* Badge de recompensa */}
              <div
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
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
            </div>

            {/* Descripción */}
            <p
              className={cn(
                "text-xs line-clamp-2 mb-3",
                status === "locked"
                  ? "text-muted-foreground/70"
                  : "text-muted-foreground",
              )}
            >
              {description}
            </p>

            {/* Barra de progreso */}
            <AchievementProgressBar
              currentProgress={currentProgress}
              goalAmount={goalAmount}
              status={status}
            />

            {/* Botón de reclamar */}
            {status === "completed" && onClaim && (
              <Button
                size="sm"
                className="w-full mt-3 bg-primary hover:bg-primary/90"
                onClick={handleClaim}
                disabled={isClaimingThis || isClaiming}
              >
                {isClaimingThis ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Reclamando...
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4 mr-2" />
                    Reclamar recompensa
                  </>
                )}
              </Button>
            )}

            {/* Badge de reclamado */}
            {status === "claimed" && (
              <div className="flex items-center justify-center gap-1.5 mt-3 py-1.5 px-3 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                <Check className="h-3.5 w-3.5" />
                Recompensa reclamada
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
