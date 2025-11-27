"use client";

import { cn } from "@/lib/utils";

interface AchievementProgressBarProps {
  currentProgress: number;
  goalAmount: number;
  status: "locked" | "completed" | "claimed";
  showLabel?: boolean;
  className?: string;
}

/**
 * Barra de progreso visual para logros
 * Muestra el progreso actual vs el objetivo
 */
export function AchievementProgressBar({
  currentProgress,
  goalAmount,
  status,
  showLabel = true,
  className,
}: AchievementProgressBarProps) {
  // Calcular porcentaje (con fallback a 100% máximo para evitar overflow)
  const percentage = Math.min((currentProgress / goalAmount) * 100, 100);

  // Formatear números grandes
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  const progressBarStyles = {
    locked: "bg-muted-foreground/30",
    completed: "bg-emerald-500",
    claimed: "bg-emerald-500",
  };

  const trackStyles = {
    locked: "bg-muted/50",
    completed: "bg-emerald-500/20",
    claimed: "bg-emerald-500/20",
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Barra de progreso */}
      <div
        className={cn(
          "relative h-2 rounded-full overflow-hidden",
          trackStyles[status],
        )}
      >
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out",
            progressBarStyles[status],
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Etiqueta de progreso */}
      {showLabel && (
        <div className="flex justify-between items-center mt-1">
          <span
            className={cn(
              "text-xs",
              status === "locked"
                ? "text-muted-foreground/70"
                : status === "completed" || status === "claimed"
                ? "text-emerald-500"
                : "text-muted-foreground",
            )}
          >
            {formatNumber(currentProgress)} / {formatNumber(goalAmount)}
          </span>
          <span
            className={cn(
              "text-xs font-medium",
              status === "claimed"
                ? "text-emerald-500"
                : status === "completed"
                ? "text-emerald-500"
                : "text-muted-foreground/70",
            )}
          >
            {percentage.toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
}
