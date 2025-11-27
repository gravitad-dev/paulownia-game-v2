"use client";

import { cn } from "@/lib/utils";
import { Coins } from "lucide-react";

type BadgeVariant = "default" | "outline";
type BadgeSize = "sm" | "md" | "lg";

interface CoinsBadgeProps {
  amount: number;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  showIcon?: boolean;
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1.5 text-sm",
  lg: "px-4 py-2 text-base",
};

const iconSizeStyles: Record<BadgeSize, string> = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-blue-500/30 text-white/90",
  outline: "bg-blue-500/40 border border-blue-400/60 text-white/90",
};

/**
 * Badge para mostrar cantidad de monedas (azul con contraste fuerte)
 */
export function CoinsBadge({
  amount,
  variant = "default",
  size = "md",
  className,
  showIcon = true,
}: CoinsBadgeProps) {
  return (
    <div
      title="Monedas disponibles"
      className={cn(
        "flex items-center gap-1.5 rounded-full font-semibold cursor-default",
        sizeStyles[size],
        variantStyles[variant],
        className,
      )}
    >
      {showIcon && (
        <Coins className={cn("text-white/90", iconSizeStyles[size])} />
      )}
      <span>{amount.toLocaleString()}</span>
    </div>
  );
}
