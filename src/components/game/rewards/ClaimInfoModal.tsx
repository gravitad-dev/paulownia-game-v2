"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/useToast";
import { RewardClaimService } from "@/services/reward-claim.service";
import { useNotificationStore } from "@/store/useNotificationStore";
import type { RewardClaim } from "@/types/reward-claim";
import {
  Calendar,
  Clock,
  FileCheck,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Package,
  Phone,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { UploadDocumentsModal } from "./UploadDocumentsModal";

interface ClaimInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Código del reclamo (si se conoce) */
  claimCode?: string;
  /** UUID del user_reward (alternativa para buscar el reclamo) */
  userRewardUuid?: string;
  onCancelSuccess?: () => void;
}

const statusConfig = {
  pending: {
    label: "Esperando documentos",
    icon: Clock,
    variant: "secondary" as const,
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    description: "Sube la documentación requerida para continuar",
  },
  processing: {
    label: "En revisión",
    icon: FileCheck,
    variant: "secondary" as const,
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    description: "Tu reclamo está siendo revisado por el administrador",
  },
  delivered: {
    label: "Entregado",
    icon: Package,
    variant: "outline" as const,
    className:
      "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
    description: "Premio entregado exitosamente",
  },
  rejected: {
    label: "Rechazado",
    icon: XCircle,
    variant: "destructive" as const,
    className: "",
    description: "Este reclamo fue rechazado por el administrador",
  },
  cancelled: {
    label: "Cancelado",
    icon: XCircle,
    variant: "secondary" as const,
    className:
      "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
    description: "Reclamo cancelado por el usuario",
  },
};

export function ClaimInfoModal({
  isOpen,
  onClose,
  claimCode,
  userRewardUuid,
  onCancelSuccess,
}: ClaimInfoModalProps) {
  const toast = useToast();
  const [claim, setClaim] = useState<RewardClaim | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [isReopening, setIsReopening] = useState(false);

  const fetchNotifications = useNotificationStore(
    (state) => state.fetchNotifications,
  );

  useEffect(() => {
    if (isOpen && (claimCode || userRewardUuid)) {
      loadClaim();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, claimCode, userRewardUuid]);

  const loadClaim = async () => {
    try {
      setIsLoading(true);
      let response;
      if (claimCode) {
        response = await RewardClaimService.getClaimByCode(claimCode);
      } else if (userRewardUuid) {
        response = await RewardClaimService.getClaimByUserRewardId(
          userRewardUuid,
        );
      } else {
        throw new Error("No se proporcionó claimCode ni userRewardUuid");
      }
      setClaim(response.data);
    } catch {
      toast.error("Error al cargar el reclamo");
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelClaim = async () => {
    if (!claim) return;

    try {
      setIsCancelling(true);
      await RewardClaimService.cancelClaim(claim.claimCode);
      toast.success("Reclamo cancelado exitosamente");
      
      // Refrescar notificaciones del store
      fetchNotifications();
      
      setShowCancelConfirm(false);
      onCancelSuccess?.();
      onClose();
    } catch {
      toast.error("Error al cancelar el reclamo");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReopenClaim = async () => {
    if (!claim) return;
    try {
      setIsReopening(true);
      await RewardClaimService.reopenClaim(claim.claimCode);
      toast.success("Reclamo reabierto exitosamente");
      loadClaim(); // Recargar para ver el nuevo estado
    } catch {
      toast.error("Error al reabrir el reclamo");
    } finally {
      setIsReopening(false);
    }
  };

  const getStatusInfo = (claim: RewardClaim) => {
    if (claim.claimStatus === "pending") {
      // Si está en pending, siempre necesita subir documentos
      if (!claim.identityDocumentFront) {
        return {
          message:
            "Sube la documentación correspondiente para continuar el reclamo.",
          showUpload: true,
        };
      }
      // Documentos subidos pero aún en pending (caso raro)
      return { message: "Documentación en proceso de validación." };
    }

    if (claim.claimStatus === "processing") {
      return { message: "Tu reclamo está siendo validado." };
    }

    if (claim.claimStatus === "delivered") {
      return { message: "¡Premio entregado!" };
    }

    if (claim.claimStatus === "rejected") {
      return {
        message: "Reclamo rechazado por el administrador.",
        showReopen: true,
      };
    }

    if (claim.claimStatus === "cancelled") {
      return {
        message: "Has cancelado este reclamo.",
        showReopen: true,
      };
    }

    return { message: "" };
  };

  const StatusIcon = claim ? statusConfig[claim.claimStatus].icon : Clock;
  const statusInfo = claim ? getStatusInfo(claim) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <DialogHeader className="sr-only">
              <DialogTitle>Cargando reclamo</DialogTitle>
              <DialogDescription>
                Por favor espere mientras cargamos la información del reclamo
              </DialogDescription>
            </DialogHeader>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : claim && statusInfo ? (
          <>
            <DialogHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-lg">
                    Estado del Reclamo
                  </DialogTitle>
                  <DialogDescription className="text-xs font-mono">
                    {claim.claimCode}
                  </DialogDescription>
                </div>
                <Badge
                  variant={statusConfig[claim.claimStatus].variant}
                  className={`ml-2 ${
                    statusConfig[claim.claimStatus].className
                  }`}
                >
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig[claim.claimStatus].label}
                </Badge>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              {/* Estado descripción */}
              <p className="text-sm text-muted-foreground">
                {statusInfo.message}
              </p>

              {/* Premio */}
              {claim.rewardSnapshot && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm font-medium">
                    {claim.rewardSnapshot.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cantidad: {claim.rewardSnapshot.quantity}
                  </p>
                </div>
              )}

              {/* Info de envío compacta */}
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span>
                    {claim.address}, {claim.city} {claim.zipCode},{" "}
                    {claim.country}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{claim.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{claim.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>
                    Creado:{" "}
                    {new Date(claim.createdAt).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              {/* Tracking Number */}
              {claim.trackingNumber && (
                <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">
                    Número de Seguimiento
                  </p>
                  <p className="font-mono font-medium">
                    {claim.trackingNumber}
                  </p>
                </div>
              )}

              {/* Notas */}
              {claim.additionalNotes && (
                <div className="flex items-start gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">
                    {claim.additionalNotes}
                  </span>
                </div>
              )}

              {/* Motivo de rechazo/cancelación */}
              {(claim.claimStatus === "rejected" ||
                claim.claimStatus === "cancelled") &&
                claim.adminNotes && (
                  <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg">
                    <p className="text-xs text-destructive font-medium mb-1 text-white">
                      {claim.claimStatus === "rejected"
                        ? "Motivo de rechazo"
                        : "Motivo de cancelación"}
                    </p>
                    <p className="text-sm">
                      {/* Parsear adminNotes para extraer el motivo */}
                      {claim.adminNotes
                        .replace(/^\[(Rejected|User Cancelled):\s*/, "")
                        .replace(/\]$/, "") || claim.adminNotes}
                    </p>
                  </div>
                )}

              {/* Botones de Acción */}
              {(() => {
                const showCancel =
                  claim.claimStatus !== "rejected" &&
                  claim.claimStatus !== "delivered" &&
                  claim.claimStatus !== "cancelled";

                // Si no hay ninguna acción disponible, no mostrar el footer
                if (
                  !statusInfo.showUpload &&
                  !statusInfo.showReopen &&
                  !showCancel
                ) {
                  return null;
                }

                return (
                  <div className="flex flex-col gap-2 pt-4 border-t w-full">
                    <div className="flex flex-row gap-2 w-full">
                      {statusInfo.showUpload && (
                        <Button
                          onClick={() => setShowUploadModal(true)}
                          className="flex-1"
                        >
                          Subir Documentos
                        </Button>
                      )}

                      {statusInfo.showReopen && (
                        <Button
                          onClick={handleReopenClaim}
                          disabled={isReopening}
                          className="flex-1"
                        >
                          {isReopening ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Reabrir Reclamo"
                          )}
                        </Button>
                      )}

                      {showCancel && (
                        <Button
                          variant="destructive"
                          onClick={() => setShowCancelConfirm(true)}
                          disabled={isCancelling}
                          className="flex-1"
                        >
                          Cancelar Reclamo
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </>
        ) : (
          <div className="py-12 text-center">
            <DialogHeader className="sr-only">
              <DialogTitle>Reclamo no encontrado</DialogTitle>
              <DialogDescription>
                No se pudo encontrar la información del reclamo solicitado
              </DialogDescription>
            </DialogHeader>
            <p className="text-muted-foreground">Reclamo no encontrado</p>
          </div>
        )}
      </DialogContent>

      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancelClaim}
        title="Cancelar Reclamo"
        description="¿Estás seguro de que deseas cancelar este reclamo? Esta acción no se puede deshacer."
        confirmText="Sí, cancelar"
        cancelText="No, mantener"
        variant="danger"
        isLoading={isCancelling}
      />

      {claim && (
        <UploadDocumentsModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          claimCode={claim.claimCode}
          onSuccess={() => {
            // Cerrar ambos modales y notificar al padre
            setShowUploadModal(false);
            onCancelSuccess?.(); // Reutilizamos este callback para refrescar la lista
            onClose();
          }}
        />
      )}
    </Dialog>
  );
}
