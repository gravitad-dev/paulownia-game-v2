"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Button3DProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "green" | "blue" | "red" | "yellow";
  className?: string;
}

const variantStyles = {
  green: {
    bg: "bg-[#2da55f]",
    border: "border-b-[1px] border-[#0D7434]",
    shadow: "[box-shadow:0_10px_0_0_#0D7434,0_15px_0_0_#0D743441]",
    activeShadow: "active:[box-shadow:0_0px_0_0_#0D7434,0_0px_0_0_#0D743441]",
  },
  blue: {
    bg: "bg-blue-500",
    border: "border-b-[1px] border-blue-400",
    shadow: "[box-shadow:0_10px_0_0_#1b6ff8,0_15px_0_0_#1b70f841]",
    activeShadow: "active:[box-shadow:0_0px_0_0_#1b6ff8,0_0px_0_0_#1b70f841]",
  },
  red: {
    bg: "bg-red-500",
    border: "border-b-[1px] border-red-400",
    shadow: "[box-shadow:0_10px_0_0_#dc2626,0_15px_0_0_#dc262641]",
    activeShadow: "active:[box-shadow:0_0px_0_0_#dc2626,0_0px_0_0_#dc262641]",
  },
  yellow: {
    bg: "bg-yellow-500",
    border: "border-b-[1px] border-yellow-400",
    shadow: "[box-shadow:0_10px_0_0_#eab308,0_15px_0_0_#eab30841]",
    activeShadow: "active:[box-shadow:0_0px_0_0_#eab308,0_0px_0_0_#eab30841]",
  },
};

export function Button3D({
  children,
  variant = "green",
  className,
  disabled,
  ...props
}: Button3DProps) {
  const styles = variantStyles[variant];

  return (
    <button
      {...props}
      disabled={disabled}
      className={cn(
        "cursor-pointer select-none",
        "rounded-lg",
        styles.bg,
        "text-white font-bold",
        "active:translate-y-2",
        styles.activeShadow,
        "active:border-b-[0px]",
        "transition-all duration-150",
        styles.shadow,
        styles.border,
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "disabled:active:translate-y-0",
        "disabled:active:border-b-[1px]",
        className
      )}
    >
      {children}
    </button>
  );
}

