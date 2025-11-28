"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SpinnerAnimationProps {
  isSpinning: boolean;
  onSpinComplete: () => void;
  duration?: number;
  className?: string;
}

/**
 * Animación simple de la ruleta (placeholder)
 * Será reemplazada por la animación del diseñador gráfico
 */
export function SpinnerAnimation({
  isSpinning,
  onSpinComplete,
  duration = 3000,
  className,
}: SpinnerAnimationProps) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (isSpinning) {
      // Rotación aleatoria (mínimo 5 vueltas completas + extra)
      const extraRotation = Math.random() * 360;
      const totalRotation = 360 * 5 + extraRotation;
      setRotation((prev) => prev + totalRotation);

      // Notificar cuando termine la animación
      const timer = setTimeout(() => {
        onSpinComplete();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isSpinning, duration, onSpinComplete]);

  return (
    <div className={cn("relative", className)}>
      {/* Contenedor de la ruleta */}
      <div className="relative w-80 h-80 mx-auto">
        {/* Indicador/flecha */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
          <div className="w-0 h-0 border-l-12 border-r-12 border-t-20 border-l-transparent border-r-transparent border-t-primary drop-shadow-lg" />
        </div>

        {/* Rueda */}
        <div
          className="w-full h-full rounded-full border-4 border-primary/30 shadow-xl overflow-hidden transition-transform"
          style={{
            transform: `rotate(${rotation}deg)`,
            transitionDuration: isSpinning ? `${duration}ms` : "0ms",
            transitionTimingFunction: "cubic-bezier(0.17, 0.67, 0.12, 0.99)",
          }}
        >
          {/* Segmentos de la ruleta (visual simple) */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1/2 h-1/2 origin-bottom-right"
              style={{
                transform: `rotate(${i * 45}deg)`,
                left: "50%",
                top: 0,
              }}
            >
              <div
                className={cn(
                  "w-full h-full",
                  i % 2 === 0 ? "bg-primary/20" : "bg-primary/10",
                )}
                style={{
                  clipPath: "polygon(0 0, 100% 100%, 0 100%)",
                }}
              />
            </div>
          ))}

          {/* Centro de la ruleta */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-background border-4 border-primary shadow-lg flex items-center justify-center">
            <span className="text-2xl">🎁</span>
          </div>
        </div>
      </div>

      {/* Texto de estado */}
      <p className="text-center mt-4 text-sm text-muted-foreground">
        {isSpinning ? "Girando..." : "Presiona para girar"}
      </p>
    </div>
  );
}
