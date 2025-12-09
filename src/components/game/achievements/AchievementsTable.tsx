"use client";

import { Achievement } from "@/types/achievements";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StandardTable } from "@/components/ui/StandardTable";
import { FALLBACK_IMAGES } from "@/constants/images";
import { Trophy, Coins, Ticket } from "lucide-react";
import Image from "next/image";

interface AchievementsTableProps {
  data: Achievement[];
  isLoading?: boolean;
  error?: string;
  onClaim?: (uuid: string) => void;
  claiming?: string | null;
}

export function AchievementsTable({
  data,
  isLoading,
  error,
  onClaim,
  claiming,
}: AchievementsTableProps) {
  return (
    <StandardTable
      headers={[
        { key: "achievement", label: "Logro", align: "left" },
        { key: "progress", label: "Progreso", align: "center", className: "hidden sm:table-cell" },
        { key: "reward", label: "Recompensa", align: "center" },
        { key: "status", label: "Estado", align: "center" },
        { key: "action", label: "Acción", align: "center" },
      ]}
      rows={data || []}
      isLoading={isLoading}
      error={error}
      minRows={5}
      emptyState={
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Trophy className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No se encontraron logros</p>
        </div>
      }
      renderRow={(achievement) => (
        <tr key={achievement.uuid} className="border-t hover:bg-muted/20">
          <td className="p-3">
            <div className="flex items-start gap-3">
              <div className="relative h-12 w-12 shrink-0">
                <Image
                  src={achievement.image || FALLBACK_IMAGES.achievement}
                  alt={achievement.title}
                  fill
                  className="rounded-md object-cover"
                  sizes="48px"
                />
              </div>
              <div className="min-w-0">
                <p className="line-clamp-1 text-sm font-medium">{achievement.title}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {achievement.description}
                </p>
              </div>
            </div>
          </td>
          <td className="hidden p-3 text-center sm:table-cell">
            <div className="flex flex-col items-center gap-1">
              <div className="text-xs font-medium">
                {achievement.currentProgress.toLocaleString()} /{" "}
                {achievement.goalAmount.toLocaleString()}
              </div>
              <div className="h-2 w-full max-w-[120px] rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-all"
                  style={{
                    width: `${Math.min(
                      (achievement.currentProgress / achievement.goalAmount) * 100,
                      100,
                    )}%`,
                  }}
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {Math.floor(
                  (achievement.currentProgress / achievement.goalAmount) * 100,
                )}
                %
              </div>
            </div>
          </td>
          <td className="p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              {achievement.rewardType === "coins" ? (
                <Coins className="h-4 w-4 text-yellow-500" />
              ) : (
                <Ticket className="h-4 w-4 text-blue-500" />
              )}
              <span className="font-medium">
                {achievement.rewardAmount.toLocaleString()}
              </span>
            </div>
          </td>
          <td className="p-3 text-center">
            {achievement.status === "locked" && (
              <Badge variant="secondary" className="text-xs">
                Bloqueado
              </Badge>
            )}
            {achievement.status === "completed" && (
              <Badge variant="default" className="bg-green-600 text-xs">
                Completado
              </Badge>
            )}
            {achievement.status === "claimed" && (
              <Badge variant="outline" className="text-xs">
                Reclamado
              </Badge>
            )}
          </td>
          <td className="p-3 text-center">
            {achievement.status === "completed" && (
              <Button
                size="sm"
                onClick={() => onClaim?.(achievement.uuid)}
                disabled={claiming === achievement.uuid}
                className="text-xs"
              >
                {claiming === achievement.uuid ? (
                  <>
                    <div className="mr-1 h-3 w-3 animate-spin rounded-full border-b-2 border-white" />
                    Reclamando...
                  </>
                ) : (
                  "Reclamar"
                )}
              </Button>
            )}
            {achievement.status === "claimed" && (
              <span className="text-xs text-muted-foreground">
                {new Date(achievement.claimedAt || "").toLocaleDateString()}
              </span>
            )}
            {achievement.status === "locked" && (
              <span className="text-xs text-muted-foreground">-</span>
            )}
          </td>
        </tr>
      )}
    />
  );
}
