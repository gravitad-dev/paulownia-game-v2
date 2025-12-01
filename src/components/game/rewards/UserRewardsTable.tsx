"use client";

import { UserRewardDetailed } from "@/types/reward";
import { Badge } from "@/components/ui/badge";
import { Gift, Package, Sparkles } from "lucide-react";
import Image from "next/image";
import { FALLBACK_IMAGES } from "@/constants/images";

interface UserRewardsTableProps {
  data: UserRewardDetailed[];
  isLoading?: boolean;
  error?: string;
}

const rewardTypeIcons = {
  currency: Sparkles,
  consumable: Package,
  cosmetic: Gift,
};

const rewardTypeLabels = {
  currency: "Moneda",
  consumable: "Consumible",
  cosmetic: "Cosmético",
};

const statusLabels = {
  notAvailable: "No disponible",
  available: "Disponible",
  claimed: "Reclamado",
  expired: "Expirado",
  blocked: "Bloqueado",
  pending: "Pendiente",
};

const statusVariants = {
  notAvailable: "secondary",
  available: "default",
  claimed: "outline",
  expired: "secondary",
  blocked: "destructive",
  pending: "secondary",
} as const;

export function UserRewardsTable({
  data,
  isLoading,
  error,
}: UserRewardsTableProps) {
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
        <Gift className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">
          No se encontraron premios
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-3 font-medium">Premio</th>
            <th className="text-center p-3 font-medium hidden sm:table-cell">
              Tipo
            </th>
            <th className="text-center p-3 font-medium">Cantidad</th>
            <th className="text-center p-3 font-medium">Estado</th>
            <th className="text-center p-3 font-medium hidden md:table-cell">
              Obtenido
            </th>
            <th className="text-center p-3 font-medium hidden lg:table-cell">
              Reclamado
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((userReward) => {
            const TypeIcon = rewardTypeIcons[userReward.reward.typeReward];
            return (
              <tr key={userReward.uuid} className="border-t hover:bg-muted/20">
                {/* Premio */}
                <td className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="relative w-12 h-12 shrink-0">
                      <Image
                        src={
                          userReward.reward.image?.url || FALLBACK_IMAGES.reward
                        }
                        alt={userReward.reward.name}
                        fill
                        className="object-cover rounded-md"
                        sizes="48px"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm line-clamp-1">
                        {userReward.reward.name}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {userReward.reward.description}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Tipo */}
                <td className="p-3 text-center hidden sm:table-cell">
                  <div className="flex items-center justify-center gap-1">
                    <TypeIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs">
                      {rewardTypeLabels[userReward.reward.typeReward]}
                    </span>
                  </div>
                </td>

                {/* Cantidad */}
                <td className="p-3 text-center">
                  <span className="font-medium">
                    {userReward.quantity}
                    {userReward.reward.typeReward === "currency" &&
                      ` × ${userReward.reward.value}`}
                  </span>
                </td>

                {/* Estado */}
                <td className="p-3 text-center">
                  <Badge
                    variant={statusVariants[userReward.rewardStatus]}
                    className="text-xs"
                  >
                    {statusLabels[userReward.rewardStatus]}
                  </Badge>
                </td>

                {/* Obtenido */}
                <td className="p-3 text-center hidden md:table-cell">
                  <span className="text-xs text-muted-foreground">
                    {new Date(userReward.obtainedAt).toLocaleDateString(
                      "es-ES",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      },
                    )}
                  </span>
                </td>

                {/* Reclamado */}
                <td className="p-3 text-center hidden lg:table-cell">
                  {userReward.claimedAt ? (
                    <span className="text-xs text-muted-foreground">
                      {new Date(userReward.claimedAt).toLocaleDateString(
                        "es-ES",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
