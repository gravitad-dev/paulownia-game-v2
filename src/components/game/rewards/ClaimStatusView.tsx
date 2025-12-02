"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { RewardClaimService } from "@/services/reward-claim.service";
import type { RewardClaim } from "@/types/reward-claim";
import { useToast } from "@/hooks/useToast";
import {
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { UploadDocumentsModal } from "./UploadDocumentsModal";

interface ClaimStatusViewProps {
  claimCode: string;
  onCancel?: () => void;
}

const statusConfig = {
  pending: {
    label: "Esperando documentos",
    icon: Clock,
    color: "bg-yellow-500",
    variant: "secondary" as const,
  },
  processing: {
    label: "En revisión",
    icon: FileCheck,
    color: "bg-blue-500",
    variant: "secondary" as const,
  },
  delivered: {
    label: "Entregado",
    icon: Package,
    color: "bg-green-500",
    variant: "outline" as const,
  },
  rejected: {
    label: "Rechazado",
    icon: XCircle,
    color: "bg-red-500",
    variant: "destructive" as const,
  },
  cancelled: {
    label: "Cancelado",
    icon: XCircle,
    color: "bg-gray-500",
    variant: "secondary" as const,
  },
};

export function ClaimStatusView({ claimCode, onCancel }: ClaimStatusViewProps) {
  const toast = useToast();
  const [claim, setClaim] = useState<RewardClaim | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const loadClaim = async () => {
    try {
      setIsLoading(true);
      const response = await RewardClaimService.getClaimByCode(claimCode);
      setClaim(response.data);
    } catch {
      toast.error("Error al cargar el reclamo");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClaim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimCode]);

  const handleCancelClaim = async () => {
    try {
      setIsCancelling(true);
      await RewardClaimService.cancelClaim(claimCode);
      toast.success("Reclamo cancelado exitosamente");
      setShowCancelConfirm(false);
      loadClaim();
      onCancel?.();
    } catch {
      toast.error("Error al cancelar el reclamo");
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!claim) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Reclamo no encontrado</p>
        </CardContent>
      </Card>
    );
  }

  const StatusIcon = statusConfig[claim.claimStatus].icon;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Reclamo {claim.claimCode}</CardTitle>
            <Badge variant={statusConfig[claim.claimStatus].variant}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig[claim.claimStatus].label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Información de Contacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Nombre Completo
              </p>
              <p className="text-sm">{claim.fullName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm">{claim.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Teléfono
              </p>
              <p className="text-sm">{claim.phone}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">País</p>
              <p className="text-sm">{claim.country}</p>
            </div>
          </div>

          {/* Dirección de Envío */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Dirección de Envío
            </p>
            <p className="text-sm">
              {claim.address}, {claim.city} {claim.zipCode}
            </p>
          </div>

          {/* Tracking Number */}
          {claim.trackingNumber && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm font-medium mb-1">Número de Seguimiento</p>
              <p className="text-lg font-mono">{claim.trackingNumber}</p>
            </div>
          )}

          {/* Menor de Edad - Info del Guardián */}
          {claim.isMinor && claim.guardian && (
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Información del Guardián</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Nombre:</span>{" "}
                  {claim.guardian.name} {claim.guardian.lastName}
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>{" "}
                  {claim.guardian.email}
                </div>
                <div>
                  <span className="text-muted-foreground">DNI:</span>{" "}
                  {claim.guardian.DNI}
                </div>
                <div>
                  {claim.guardianEmailConfirmed ? (
                    <Badge variant="default" className="text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Email Confirmado
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Pendiente Confirmación
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Verificación de Identidad */}
          {claim.requiresIdentityVerification && (
            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Verificación de Identidad Requerida
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Este premio requiere verificación de documentos de
                    identidad.
                  </p>
                  {claim.claimStatus === "pending" && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => setIsUploadModalOpen(true)}
                      className="mt-3"
                    >
                      <FileCheck className="h-3 w-3 mr-1" />
                      Subir Documentos
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Rechazado */}
          {claim.claimStatus === "cancelled" && claim.rejectionReason && (
            <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                Motivo de Rechazo
              </p>
              <p className="text-sm mt-1">{claim.rejectionReason}</p>
            </div>
          )}

          {/* Notas Adicionales */}
          {claim.additionalNotes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Notas Adicionales
              </p>
              <p className="text-sm">{claim.additionalNotes}</p>
            </div>
          )}

          {/* Acciones */}
          {claim.claimStatus !== "cancelled" &&
            claim.claimStatus !== "delivered" &&
            claim.claimStatus !== "rejected" && (
              <div className="pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={isCancelling}
                >
                  Cancelar Reclamo
                </Button>
              </div>
            )}
        </CardContent>
      </Card>

      {claim && (
        <UploadDocumentsModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          claimCode={claim.claimCode}
          onSuccess={loadClaim}
        />
      )}

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
    </>
  );
}
