"use client";

import { UserGameHistory } from "@/types/user";
import { cn } from "@/lib/utils";

interface ScoresTableProps {
  data: UserGameHistory[];
  isLoading?: boolean;
  error?: string;
}

const formatDuration = (duration: number) => {
  if (!duration || duration <= 0) return "0:00";
  const totalSeconds = Math.floor(duration);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const formatDateTime = (value: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const getLevelLabel = (level: UserGameHistory["level"]) => {
  if (!level) return "-";
  if (typeof level === "number") return `Nivel ${level}`;
  if (typeof level === "object") {
    if (level.name) return level.name;
    if (level.id) return `Nivel ${level.id}`;
  }
  return "-";
};

export function ScoresTable({ data, isLoading, error }: ScoresTableProps) {
  if (isLoading) {
    return (
      <div className="w-full py-10 text-center text-sm text-muted-foreground">
        Cargando historial de partidas...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-6 text-sm text-destructive">
        {error}
      </div>
    );
  }

  const safeData = data ?? [];
  const MIN_ROWS = 6;
  const realRowsCount = safeData.length;
  const emptyRowsCount =
    realRowsCount < MIN_ROWS ? MIN_ROWS - realRowsCount : 0;

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold leading-tight">
          Historial de partidas
        </h2>
      </div>

      <div className="w-full overflow-x-auto rounded-lg border border-border/60 bg-card/40">
        <table className="min-w-full text-xs sm:text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th
                scope="col"
                className="px-3 py-2 text-left font-medium text-muted-foreground"
              >
                Nivel
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-right font-medium text-muted-foreground"
              >
                Puntaje
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-right font-medium text-muted-foreground"
              >
                Duración
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-left font-medium text-muted-foreground"
              >
                Completado
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-right font-medium text-muted-foreground"
              >
                Monedas
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-left font-medium text-muted-foreground"
              >
                Fecha
              </th>
            </tr>
          </thead>
          <tbody>
            {safeData.map((game) => (
              <tr
                key={game.uuid}
                className={cn(
                  "border-t border-border/40 hover:bg-muted/40 transition-colors"
                )}
              >
                <td className="px-3 py-2 align-middle">
                  {getLevelLabel(game.level)}
                </td>
                <td className="px-3 py-2 text-right align-middle font-medium">
                  {game.score}
                </td>
                <td className="px-3 py-2 text-right align-middle text-muted-foreground">
                  {formatDuration(game.duration)}
                </td>
                <td className="px-3 py-2 align-middle">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                      game.completed
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/40"
                        : "bg-amber-500/10 text-amber-500 border border-amber-500/40"
                    )}
                  >
                    {game.completed ? "Sí" : "No"}
                  </span>
                </td>
                <td className="px-3 py-2 text-right align-middle">
                  {game.coinsEarned}
                </td>
                <td className="px-3 py-2 align-middle text-muted-foreground">
                  {formatDateTime(game.completedAt)}
                </td>
              </tr>
            ))}

            {emptyRowsCount > 0 &&
              Array.from({ length: emptyRowsCount }).map((_, index) => (
                <tr
                  key={`empty-row-${index}`}
                  className="border-t border-border/40"
                >
                  <td className="px-3 py-2 align-middle">&nbsp;</td>
                  <td className="px-3 py-2 text-right align-middle">&nbsp;</td>
                  <td className="px-3 py-2 text-right align-middle">&nbsp;</td>
                  <td className="px-3 py-2 align-middle">&nbsp;</td>
                  <td className="px-3 py-2 text-right align-middle">&nbsp;</td>
                  <td className="px-3 py-2 align-middle">&nbsp;</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}


