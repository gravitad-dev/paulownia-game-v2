"use client";

import { Achievement } from "@/types/achievements";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Coins, Ticket } from "lucide-react";
import Image from "next/image";
import { FALLBACK_IMAGES } from "@/constants/images";

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
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">
          No se encontraron logros
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-3 font-medium">Logro</th>
            <th className="text-center p-3 font-medium hidden sm:table-cell">
              Progreso
            </th>
            <th className="text-center p-3 font-medium">Recompensa</th>
            <th className="text-center p-3 font-medium">Estado</th>
            <th className="text-center p-3 font-medium">Acción</th>
          </tr>
        </thead>
        <tbody>
          {data.map((achievement) => (
            <tr key={achievement.uuid} className="border-t hover:bg-muted/20">
              {/* Logro */}
              <td className="p-3">
                <div className="flex items-start gap-3">
                  <div className="relative w-12 h-12 shrink-0">
                    <Image
                      src={achievement.image || FALLBACK_IMAGES.achievement}
                      alt={achievement.title}
                      fill
                      className="object-cover rounded-md"
                      sizes="48px"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm line-clamp-1">
                      {achievement.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {achievement.description}
                    </p>
                  </div>
                </div>
              </td>

              {/* Progreso */}
              <td className="p-3 text-center hidden sm:table-cell">
                <div className="flex flex-col items-center gap-1">
                  <div className="text-xs font-medium">
                    {achievement.currentProgress.toLocaleString()} /{" "}
                    {achievement.goalAmount.toLocaleString()}
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 max-w-[120px]">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          (achievement.currentProgress /
                            achievement.goalAmount) *
                            100,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Math.floor(
                      (achievement.currentProgress / achievement.goalAmount) *
                        100,
                    )}
                    %
                  </div>
                </div>
              </td>

              {/* Recompensa */}
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

              {/* Estado */}
              <td className="p-3 text-center">
                {achievement.status === "locked" && (
                  <Badge variant="secondary" className="text-xs">
                    Bloqueado
                  </Badge>
                )}
                {achievement.status === "completed" && (
                  <Badge variant="default" className="text-xs bg-green-600">
                    Completado
                  </Badge>
                )}
                {achievement.status === "claimed" && (
                  <Badge variant="outline" className="text-xs">
                    Reclamado
                  </Badge>
                )}
              </td>

              {/* Acción */}
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
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
