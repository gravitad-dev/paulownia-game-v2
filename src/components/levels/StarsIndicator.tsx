"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface StarsIndicatorProps {
  wonDifficulties: string[];
  className?: string;
}

/**
 * Orden fijo de las 6 dificultades del juego
 */
const DIFFICULTY_ORDER: string[] = [
  "aprendiz",
  "novato",
  "aventurero",
  "veterano",
  "maestro",
  "leyenda",
];

/**
 * Normaliza un string de dificultad para comparación
 * (trim, lowercase, elimina espacios extra)
 */
function normalizeDifficulty(difficulty: string): string {
  return difficulty.trim().toLowerCase().replace(/\s+/g, " ");
}

export function StarsIndicator({
  wonDifficulties = [],
  className,
}: StarsIndicatorProps) {
  // Normalizar y crear un Set para búsqueda rápida
  // Manejar casos donde wonDifficulties puede ser null, undefined, o tener valores inválidos
  const normalizedWonDifficulties = Array.isArray(wonDifficulties)
    ? wonDifficulties
        .filter((d): d is string => typeof d === "string" && d.trim().length > 0)
        .map(normalizeDifficulty)
    : [];
  
  const wonSet = new Set(normalizedWonDifficulties);

  return (
    <div
      className={cn(
        "flex items-center gap-1 z-10",
        className
      )}
    >
      {DIFFICULTY_ORDER.map((difficulty) => {
        // Normalizar la dificultad del orden para comparación
        const normalizedDifficulty = normalizeDifficulty(difficulty);
        const isCompleted = wonSet.has(normalizedDifficulty);
        return (
          <div
            key={difficulty}
            className={cn(
              "relative w-6 h-6 transition-all duration-200",
              isCompleted && "scale-110"
            )}
          >
            <div className="relative w-full h-full">
              <Image
                src="/game/levels/star.svg"
                alt={isCompleted ? "Estrella completada" : "Estrella no completada"}
                width={24}
                height={24}
                className={cn(
                  "w-full h-full object-contain transition-all duration-200",
                  isCompleted
                    ? "brightness-110 saturate-150 drop-shadow-[0_0_4px_rgba(255,215,0,0.8)]"
                    : "opacity-100"
                )}
                style={
                  !isCompleted
                    ? {
                        filter: "brightness(0) saturate(100%) invert(85%)",
                      }
                    : undefined
                }
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

