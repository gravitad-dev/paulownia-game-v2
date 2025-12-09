"use client";

import { UserGameHistory } from "@/types/user";
import { StandardTable } from "@/components/ui/StandardTable";
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
  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold leading-tight">
          Historial de partidas
        </h2>
      </div>

      <StandardTable
        headers={[
          { key: "level", label: "Nivel", align: "left" },
          { key: "score", label: "Puntaje", align: "right" },
          { key: "duration", label: "Duración", align: "right" },
          { key: "completed", label: "Completado", align: "left" },
          { key: "coins", label: "Monedas", align: "right" },
          { key: "date", label: "Fecha", align: "left" },
        ]}
        rows={data || []}
        isLoading={isLoading}
        error={error}
        minRows={5}
        loadingContent={
          <div className="w-full py-10 text-center text-sm text-muted-foreground">
            Cargando historial de partidas...
          </div>
        }
        emptyState={
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm text-muted-foreground">
              Aún no hay partidas registradas.
            </p>
          </div>
        }
        renderRow={(game) => (
          <tr
            key={game.uuid}
            className={cn(
              "border-t border-border/40 transition-colors hover:bg-muted/40",
            )}
          >
            <td className="p-3 align-middle">{getLevelLabel(game.level)}</td>
            <td className="p-3 text-right align-middle font-medium">
              {game.score}
            </td>
            <td className="p-3 text-right align-middle text-muted-foreground">
              {formatDuration(game.duration)}
            </td>
            <td className="p-3 align-middle">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                  game.completed
                    ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                    : "border border-amber-500/40 bg-amber-500/10 text-amber-500",
                )}
              >
                {game.completed ? "Sí" : "No"}
              </span>
            </td>
            <td className="p-3 text-right align-middle">{game.coinsEarned}</td>
            <td className="p-3 align-middle text-muted-foreground">
              {formatDateTime(game.completedAt)}
            </td>
          </tr>
        )}
      />
    </section>
  );
}


