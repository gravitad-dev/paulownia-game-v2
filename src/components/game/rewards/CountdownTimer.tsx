"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  targetDate: string | null;
  onComplete?: () => void;
  className?: string;
  /** Mostrar días cuando el tiempo restante es mayor a 24 horas */
  showDays?: boolean;
  /** Texto personalizado para el label (por defecto: "Próxima recompensa en:") */
  label?: string;
  /** Ocultar el label */
  hideLabel?: boolean;
  /** Tamaño compacto para usar en espacios reducidos */
  compact?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

/**
 * Calcula el tiempo restante hasta una fecha objetivo
 */
const calculateTimeLeft = (targetDate: string): TimeLeft => {
  const difference = new Date(targetDate).getTime() - new Date().getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    total: difference,
  };
};

/**
 * Formatea un número a dos dígitos (ej: 5 -> "05")
 */
const padNumber = (num: number): string => {
  return num.toString().padStart(2, "0");
};

/**
 * Componente de cuenta regresiva para la próxima recompensa
 */
export function CountdownTimer({
  targetDate,
  onComplete,
  className,
  showDays = false,
  label = "Próxima recompensa en:",
  hideLabel = false,
  compact = false,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!targetDate || !mounted) return;

    // Calcular tiempo inicial
    setTimeLeft(calculateTimeLeft(targetDate));

    // Actualizar cada segundo
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(targetDate);
      setTimeLeft(newTimeLeft);

      if (newTimeLeft.total <= 0) {
        clearInterval(timer);
        onComplete?.();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete, mounted]);

  // No renderizar hasta que esté montado (evitar hydration mismatch)
  if (!mounted || !targetDate) {
    return null;
  }

  // Si el tiempo ya pasó, no mostrar nada
  if (timeLeft.total <= 0) {
    return null;
  }

  // Determinar si mostrar días (si showDays es true y hay días restantes)
  const shouldShowDays = showDays && timeLeft.days > 0;

  // Clases según el modo compact
  const containerClasses = compact
    ? "flex items-center gap-1 font-mono text-sm font-semibold"
    : "flex items-center justify-center gap-1 font-mono text-lg font-bold";

  return (
    <div className={className}>
      {!hideLabel && (
        <p className="text-xs text-accent-foreground mb-1 text-center">
          {label}
        </p>
      )}
      <div className={containerClasses}>
        {shouldShowDays && (
          <>
            <TimeUnit value={timeLeft.days} label="d" compact={compact} />
            <span className="text-muted-foreground">:</span>
          </>
        )}
        <TimeUnit value={timeLeft.hours} label="h" compact={compact} />
        <span className="text-muted-foreground">:</span>
        <TimeUnit value={timeLeft.minutes} label="m" compact={compact} />
        <span className="text-muted-foreground">:</span>
        <TimeUnit value={timeLeft.seconds} label="s" compact={compact} />
      </div>
    </div>
  );
}

/**
 * Unidad individual de tiempo (días, horas, minutos, segundos)
 */
function TimeUnit({
  value,
  label,
  compact = false,
}: {
  value: number;
  label: string;
  compact?: boolean;
}) {
  const boxClasses = compact
    ? "bg-muted/50 px-1.5 py-0.5 rounded min-w-7 text-center"
    : "bg-muted/50 px-2 py-1 rounded-md min-w-10 text-center";

  const labelClasses = compact
    ? "text-[8px] text-muted-foreground"
    : "text-[10px] text-muted-foreground";

  return (
    <div className="flex items-baseline gap-0.5">
      <span className={boxClasses}>{padNumber(value)}</span>
      <span className={labelClasses}>{label}</span>
    </div>
  );
}
