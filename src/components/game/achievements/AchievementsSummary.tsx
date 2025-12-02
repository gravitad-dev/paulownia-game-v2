"use client";

import { Achievement } from "@/types/achievements";

interface AchievementsSummaryProps {
  achievements: Achievement[];
}

export function AchievementsSummary({
  achievements,
}: AchievementsSummaryProps) {
  const total = achievements.length;
  const locked = achievements.filter((a) => a.status === "locked").length;
  const completed = achievements.filter((a) => a.status === "completed").length;
  const claimed = achievements.filter((a) => a.status === "claimed").length;

  return (
    <div className="grid gap-4 sm:grid-cols-4">
      <div className="relative overflow-hidden rounded-2xl border border-purple-400/60 bg-linear-to-br from-purple-500/15 via-purple-400/10 to-purple-300/20 px-4 py-3 shadow-sm">
        <div className="pointer-events-none absolute -right-3 -top-3 h-12 w-12 rounded-full bg-purple-300/30 blur-xl" />
        <p className="text-[11px] font-semibold uppercase tracking-wide text-purple-700 dark:text-purple-200">
          Total
        </p>
        <p className="mt-1 text-2xl font-extrabold text-purple-700 dark:text-purple-200 drop-shadow-[0_1px_0_rgba(0,0,0,0.25)]">
          {total}
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-slate-400/60 bg-linear-to-br from-slate-500/15 via-slate-400/10 to-slate-300/20 px-4 py-3 shadow-sm">
        <div className="pointer-events-none absolute -right-4 -bottom-4 h-14 w-14 rounded-full bg-slate-300/30 blur-xl" />
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
          Bloqueados
        </p>
        <p className="mt-1 text-2xl font-extrabold text-slate-700 dark:text-slate-200 drop-shadow-[0_1px_0_rgba(0,0,0,0.25)]">
          {locked}
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-emerald-400/60 bg-linear-to-br from-emerald-500/15 via-emerald-400/10 to-emerald-300/20 px-4 py-3 shadow-sm">
        <div className="pointer-events-none absolute -left-3 -top-3 h-12 w-12 rounded-full bg-emerald-300/30 blur-xl" />
        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">
          Completados
        </p>
        <p className="mt-1 text-2xl font-extrabold text-emerald-700 dark:text-emerald-200 drop-shadow-[0_1px_0_rgba(0,0,0,0.25)]">
          {completed}
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-sky-400/60 bg-linear-to-br from-sky-500/15 via-sky-400/10 to-sky-300/20 px-4 py-3 shadow-sm">
        <div className="pointer-events-none absolute -right-4 top-2 h-10 w-10 rounded-full bg-sky-300/40 blur-xl" />
        <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-200">
          Reclamados
        </p>
        <p className="mt-1 text-2xl font-extrabold text-sky-700 dark:text-sky-200 drop-shadow-[0_1px_0_rgba(0,0,0,0.25)]">
          {claimed}
        </p>
      </div>
    </div>
  );
}
