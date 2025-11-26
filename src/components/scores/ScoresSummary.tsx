"use client";

import { UserGameHistory } from "@/types/user";
import { DEFAULT_SUMMARY_LIMIT, calculateScoresSummary } from "@/lib/scores";

interface ScoresSummaryProps {
  histories: UserGameHistory[];
  limit?: number;
}

export function ScoresSummary({
  histories,
  limit = DEFAULT_SUMMARY_LIMIT,
}: ScoresSummaryProps) {
  const stats = calculateScoresSummary(histories, limit);

  return (
    <section className="w-full mb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
        <div>
          <h2 className="text-base font-semibold leading-tight">Resumen</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Estadísticas calculadas sobre las últimas{" "}
            <span className="font-medium">{limit}</span> partidas jugadas.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-400/60 bg-gradient-to-br from-emerald-500/15 via-emerald-400/10 to-emerald-300/20 px-4 py-3 shadow-sm">
          <div className="pointer-events-none absolute -right-3 -top-3 h-12 w-12 rounded-full bg-emerald-300/30 blur-xl" />
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">
            Partidas consideradas
          </p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-700 dark:text-emerald-200 drop-shadow-[0_1px_0_rgba(0,0,0,0.25)]">
            {stats.gamesCount}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-sky-400/60 bg-gradient-to-br from-sky-500/15 via-sky-400/10 to-sky-300/20 px-4 py-3 shadow-sm">
          <div className="pointer-events-none absolute -right-4 -bottom-4 h-14 w-14 rounded-full bg-sky-300/30 blur-xl" />
          <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-200">
            Puntaje promedio
          </p>
          <p className="mt-1 text-2xl font-extrabold text-sky-700 dark:text-sky-200 drop-shadow-[0_1px_0_rgba(0,0,0,0.25)]">
            {stats.averageScore.toFixed(0)}
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-amber-400/60 bg-gradient-to-br from-amber-500/15 via-amber-400/10 to-amber-300/20 px-4 py-3 shadow-sm">
          <div className="pointer-events-none absolute -left-3 -top-3 h-12 w-12 rounded-full bg-amber-300/30 blur-xl" />
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-100">
            Partidas completadas
          </p>
          <p className="mt-1 text-2xl font-extrabold text-amber-700 dark:text-amber-100 drop-shadow-[0_1px_0_rgba(0,0,0,0.25)]">
            {stats.completedPercentage.toFixed(0)}%
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-fuchsia-400/60 bg-gradient-to-br from-fuchsia-500/15 via-fuchsia-400/10 to-fuchsia-300/20 px-4 py-3 shadow-sm">
          <div className="pointer-events-none absolute -right-4 top-2 h-10 w-10 rounded-full bg-fuchsia-300/40 blur-xl" />
          <p className="text-[11px] font-semibold uppercase tracking-wide text-fuchsia-700 dark:text-fuchsia-100">
            Monedas obtenidas
          </p>
          <p className="mt-1 text-2xl font-extrabold text-fuchsia-700 dark:text-fuchsia-100 drop-shadow-[0_1px_0_rgba(0,0,0,0.25)]">
            {stats.totalCoins}
          </p>
        </div>
      </div>
    </section>
  );
}
