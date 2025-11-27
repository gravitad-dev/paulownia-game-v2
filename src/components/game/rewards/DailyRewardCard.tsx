"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Coins, Ticket, Lock, Check, Crown, Sparkles } from "lucide-react";
import type { DailyReward, RewardStatus } from "@/types/daily-rewards";
import gsap from "gsap";

interface DailyRewardCardProps {
  reward: DailyReward;
  isCompact?: boolean;
  isSpecial?: boolean;
}

/**
 * Icono según el tipo de recompensa
 */
const RewardIcon = ({
  type,
  className,
}: {
  type: string;
  className?: string;
}) => {
  if (type === "tickets") {
    return <Ticket className={cn("h-5 w-5", className)} />;
  }
  return <Coins className={cn("h-5 w-5", className)} />;
};

/**
 * Formatea el monto de la recompensa
 */
const formatAmount = (amount: number, type: string): string => {
  if (type === "tickets") {
    return amount === 1 ? "1 Ticket" : `${amount} Tickets`;
  }
  return amount.toLocaleString();
};

/**
 * Tarjeta individual de recompensa diaria
 * Muestra diferentes estados: locked, available, claimed
 */
export function DailyRewardCard({
  reward,
  isCompact = false,
  isSpecial = false,
}: DailyRewardCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const { status, day, rewardType, rewardAmount } = reward;

  const statusStyles: Record<RewardStatus, string> = {
    locked: "bg-muted/30 border-2 border-gray text-muted-foreground opacity-50",
    available: isSpecial
      ? "bg-linear-to-br from-amber-500/20 via-amber-500/10 to-amber-500/5 border-amber-500 shadow shadow-amber-500/10"
      : "bg-linear-to-br from-primary/20 via-primary/10 to-primary/5 border-primary shadow shadow-primary/10",
    claimed: "bg-emerald-500/15 border-emerald-500/40",
  };

  // Clases del icono de estado
  const statusIconStyles: Record<RewardStatus, string> = {
    locked: "bg-muted/50 text-muted-foreground/70",
    available: isSpecial
      ? "bg-amber-500 text-white shadow-amber-500/50 shadow-sm"
      : "bg-primary text-primary-foreground",
    claimed: "bg-emerald-500 text-white",
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-xl border-2 transition-all duration-300",
        statusStyles[status],
        isCompact
          ? "p-2 pt-4 pb-4 min-w-[70px] min-h-[90px]"
          : isSpecial
          ? "p-4 pt-6 pb-6 w-full min-h-[90px] sm:min-w-40"
          : "p-3 pt-5 pb-5 sm:p-4 sm:pt-6 sm:pb-6 w-full min-h-[120px]",
        // Asegurar que no se comprima demasiado en flex
        "flex-1 min-w-[100px] max-w-40",
        isSpecial && "min-w-[140px] max-w-[200px] border-amber-500/50",
      )}
    >
      {/* Glow effect para available */}
      {status === "available" && (
        <div
          ref={glowRef}
          className={cn(
            "absolute inset-0 rounded-xl blur-md -z-10",
            isSpecial ? "bg-amber-500/20" : "bg-primary/20",
          )}
          aria-hidden="true"
        />
      )}

      {/* Badge del día */}
      <div
        className={cn(
          "absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap",
          status === "available"
            ? isSpecial
              ? "bg-amber-500 text-white shadow-sm"
              : "bg-primary text-primary-foreground shadow-sm"
            : status === "claimed"
            ? "bg-emerald-500 text-white shadow-sm"
            : "bg-muted/70 text-muted-foreground",
        )}
      >
        {isSpecial && <Crown className="inline-block w-3 h-3 mr-1 -mt-0.5" />}
        Día {day}
      </div>

      {/* Icono de estado */}
      <div
        className={cn(
          "rounded-full p-1.5 mb-2 mt-2 transition-transform duration-300",
          statusIconStyles[status],
          isSpecial && status === "available" && "scale-125",
        )}
      >
        {status === "locked" ? (
          <Lock className={cn(isCompact ? "h-4 w-4" : "h-5 w-5")} />
        ) : status === "claimed" ? (
          <Check className={cn(isCompact ? "h-4 w-4" : "h-5 w-5")} />
        ) : (
          <RewardIcon
            type={rewardType}
            className={isCompact ? "h-4 w-4" : "h-5 w-5"}
          />
        )}
      </div>

      {/* Cantidad y tipo */}
      <div className="flex flex-col items-center gap-0.5">
        <div
          className={cn(
            "flex items-center gap-1 font-bold",
            isCompact ? "text-sm" : "text-base sm:text-lg",
            isSpecial && "text-xl sm:text-2xl", // Texto más grande si es especial
            status === "claimed"
              ? "text-emerald-400"
              : status === "locked"
              ? "text-muted-foreground/70"
              : isSpecial
              ? "text-amber-500"
              : "text-foreground",
          )}
        >
          {status !== "locked" && (
            <RewardIcon
              type={rewardType}
              className={cn(
                isCompact ? "h-3 w-3" : "h-4 w-4",
                isSpecial && "h-5 w-5",
                status === "claimed"
                  ? "text-emerald-400"
                  : isSpecial
                  ? "text-amber-500"
                  : "text-primary",
              )}
            />
          )}
          <span>{rewardAmount}</span>
        </div>
        <span
          className={cn(
            "capitalize",
            isCompact ? "text-[10px]" : "text-xs",
            status === "claimed"
              ? "text-emerald-400/70"
              : "text-muted-foreground",
          )}
        >
          {rewardType === "tickets"
            ? formatAmount(rewardAmount, rewardType).split(" ")[1]
            : "Monedas"}
        </span>
      </div>

      {/* Indicador de reclamado */}
      {status === "claimed" && (
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-semibold shadow-sm whitespace-nowrap">
          ✓ Reclamado
        </div>
      )}

      {/* Decoración extra para especial */}
      {isSpecial && status !== "locked" && status !== "claimed" && (
        <>
          <Sparkles className="absolute top-2 right-2 h-4 w-4 text-amber-500/40 animate-pulse" />
          <Sparkles className="absolute bottom-2 left-2 h-3 w-3 text-amber-500/40 animate-pulse delay-700" />
        </>
      )}
    </div>
  );
}
