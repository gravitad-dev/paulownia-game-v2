"use client";

import { useState, useEffect } from "react";

interface CountdownTimerProps {
  targetDate: string | null;
  onComplete?: () => void;
  className?: string;
}

interface TimeLeft {
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
    return { hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    hours: Math.floor(difference / (1000 * 60 * 60)),
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
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
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

  return (
    <div className={className}>
      <p className="text-xs text-accent-foreground mb-1 text-center">
        Próxima recompensa en:
      </p>
      <div className="flex items-center justify-center gap-1 font-mono text-lg font-bold">
        <TimeUnit value={timeLeft.hours} label="h" />
        <span className="text-muted-foreground">:</span>
        <TimeUnit value={timeLeft.minutes} label="m" />
        <span className="text-muted-foreground">:</span>
        <TimeUnit value={timeLeft.seconds} label="s" />
      </div>
    </div>
  );
}

/**
 * Unidad individual de tiempo (horas, minutos, segundos)
 */
function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-0.5">
      <span className="bg-muted/50 px-2 py-1 rounded-md min-w-10 text-center">
        {padNumber(value)}
      </span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
