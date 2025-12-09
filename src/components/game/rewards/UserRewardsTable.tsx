"use client";

import { UserRewardDetailed } from "@/types/reward";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StandardTable } from "@/components/ui/StandardTable";
import { Gift, Package, Coins, Ticket, FileText, Clock } from "lucide-react";
import Image from "next/image";
import { FALLBACK_IMAGES } from "@/constants/images";
import { useState } from "react";
import { ClaimRewardModal } from "./ClaimRewardModal";
import { ClaimInfoModal } from "./ClaimInfoModal";

interface UserRewardsTableProps {
  data: UserRewardDetailed[];
  isLoading?: boolean;
  error?: string;
  /** Callback cuando se crea un reclamo exitosamente para refrescar los datos */
  onClaimSuccess?: () => void;
}

// Helper para detectar si es coin o ticket
const isTicket = (name: string) => name.toLowerCase().includes("ticket");

// Obtener el icono según el tipo y nombre del premio
const getRewardIcon = (typeReward: string, name: string) => {
  if (typeReward === "currency") {
    if (isTicket(name)) return Ticket;
    return Coins; // Por defecto coins
  }
  if (typeReward === "consumable") return Package;
  if (typeReward === "cosmetic") return Gift;
  return Gift;
};

// Obtener la etiqueta según el tipo y nombre del premio
const getRewardTypeLabel = (typeReward: string, name: string) => {
  if (typeReward === "currency") {
    if (isTicket(name)) return "Tickets";
    return "Monedas";
  }
  if (typeReward === "consumable") return "Consumible";
  if (typeReward === "cosmetic") return "Cosmético";
  return "Premio";
};

const statusLabels = {
  notAvailable: "No disponible",
  available: "Disponible",
  claimed: "Entregado",
  expired: "Expirado",
  blocked: "Bloqueado",
  pending: "Pendiente",
  in_claim: "En trámite",
};

const statusVariants = {
  notAvailable: "secondary",
  available: "default",
  claimed: "outline",
  expired: "secondary",
  blocked: "destructive",
  pending: "secondary",
  in_claim: "default",
} as const;

const statusStyles = {
  notAvailable: "bg-muted text-muted-foreground",
  available: "bg-black text-white dark:bg-white dark:text-black",
  claimed:
    "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  expired: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  blocked: "bg-destructive text-destructive-foreground",
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  in_claim: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

export function UserRewardsTable({
  data,
  isLoading,
  error,
  onClaimSuccess,
}: UserRewardsTableProps) {
  const [selectedReward, setSelectedReward] =
    useState<UserRewardDetailed | null>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isClaimInfoModalOpen, setIsClaimInfoModalOpen] = useState(false);
  const [selectedClaimRewardUuid, setSelectedClaimRewardUuid] = useState<
    string | null
  >(null);

  const handleClaimClick = (reward: UserRewardDetailed) => {
    setSelectedReward(reward);
    setIsClaimModalOpen(true);
  };

  const handleViewClaimClick = (rewardUuid: string) => {
    setSelectedClaimRewardUuid(rewardUuid);
    setIsClaimInfoModalOpen(true);
  };

  return (
    <>
      <StandardTable
        headers={[
          { key: "reward", label: "Premio", align: "left" },
          { key: "type", label: "Tipo", align: "center", className: "hidden sm:table-cell" },
          { key: "amount", label: "Cantidad", align: "center" },
          { key: "status", label: "Estado", align: "center" },
          { key: "obtained", label: "Obtenido", align: "center", className: "hidden md:table-cell" },
          { key: "claimed", label: "Reclamado", align: "center", className: "hidden lg:table-cell" },
          { key: "actions", label: "Acciones", align: "center" },
        ]}
        rows={data || []}
        isLoading={isLoading}
        error={error}
        minRows={5}
        emptyState={
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Gift className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No se encontraron premios
            </p>
          </div>
        }
        renderRow={(userReward) => {
          const TypeIcon = getRewardIcon(
            userReward.reward.typeReward,
            userReward.reward.name,
          );
          const typeLabel = getRewardTypeLabel(
            userReward.reward.typeReward,
            userReward.reward.name,
          );
          const hasActiveClaim = userReward.hasClaim === true;
          const canClaim = userReward.canBeClaimed === true && !hasActiveClaim;

          return (
            <tr key={userReward.uuid} className="border-t hover:bg-muted/20">
              <td className="p-3">
                <div className="flex items-start gap-3">
                  <div className="relative h-12 w-12 shrink-0">
                    <Image
                      src={
                        userReward.reward.image?.url || FALLBACK_IMAGES.reward
                      }
                      alt={userReward.reward.name}
                      fill
                      className="rounded-md object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-medium">
                      {userReward.reward.name}
                    </p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {userReward.reward.description}
                    </p>
                  </div>
                </div>
              </td>
              <td className="hidden p-3 text-center sm:table-cell">
                <div className="flex items-center justify-center gap-1">
                  <TypeIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs">{typeLabel}</span>
                </div>
              </td>
              <td className="p-3 text-center">
                <span className="font-medium">
                  {userReward.reward.typeReward === "currency"
                    ? userReward.reward.value
                    : userReward.quantity}
                </span>
              </td>
              <td className="p-3 text-center">
                <Badge
                  variant={statusVariants[userReward.rewardStatus]}
                  className={`text-xs ${statusStyles[userReward.rewardStatus]}`}
                >
                  {statusLabels[userReward.rewardStatus]}
                </Badge>
              </td>
              <td className="hidden p-3 text-center md:table-cell">
                <span className="text-xs text-muted-foreground">
                  {new Date(userReward.obtainedAt).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </td>
              <td className="hidden p-3 text-center lg:table-cell">
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
              <td className="p-3 text-center">
                {canClaim && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleClaimClick(userReward)}
                    className="text-xs"
                  >
                    <FileText className="mr-1 h-3 w-3" />
                    Reclamar
                  </Button>
                )}
                {hasActiveClaim && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewClaimClick(userReward.uuid)}
                    className="text-xs"
                  >
                    <Clock className="mr-1 h-3 w-3" />
                    Ver estado
                  </Button>
                )}
                {!canClaim && !hasActiveClaim && (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </td>
            </tr>
          );
        }}
      />

      {selectedReward && (
        <ClaimRewardModal
          isOpen={isClaimModalOpen}
          onClose={() => {
            setIsClaimModalOpen(false);
            setSelectedReward(null);
          }}
          userReward={selectedReward}
          onSuccess={onClaimSuccess}
        />
      )}

      {selectedClaimRewardUuid && (
        <ClaimInfoModal
          isOpen={isClaimInfoModalOpen}
          onClose={() => {
            setIsClaimInfoModalOpen(false);
            setSelectedClaimRewardUuid(null);
          }}
          userRewardUuid={selectedClaimRewardUuid}
          onCancelSuccess={onClaimSuccess}
        />
      )}
    </>
  );
}
