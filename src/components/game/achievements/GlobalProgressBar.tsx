"use client";

import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Gauge } from "lucide-react";

interface GlobalProgressBarProps {
  averagePercentage: number;
  className?: string;
}

export function GlobalProgressBar({
  averagePercentage,
  className,
}: GlobalProgressBarProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm",
        className,
      )}
    >
      <div className="relative p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Gauge className="h-5 w-5 text-primary" />
              Progreso Global
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Completa objetivos para desbloquear recompensas
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-primary">
              {averagePercentage}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <Progress value={averagePercentage} className="h-3" />
      </div>
    </div>
  );
}
