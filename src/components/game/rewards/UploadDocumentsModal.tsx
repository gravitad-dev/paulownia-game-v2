"use client";

import { useState, useEffect, useMemo } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/useAuthStore";
import { useToast } from "@/hooks/useToast";
import { RewardClaimService } from "@/services/reward-claim.service";
import type {
  UploadDocumentsData,
  IdentityDocumentType,
} from "@/types/reward-claim";
import type { Guardian } from "@/types/user";
import {
  Loader2,
  Upload,
  FileText,
  AlertTriangle,
  UserCheck,
} from "lucide-react";

interface UploadDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimCode: string;
  onSuccess?: () => void;
}

export function UploadDocumentsModal({
  isOpen,
  onClose,
  claimCode,
  onSuccess,
}: UploadDocumentsModalProps) {
  const { user } = useAuthStore();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMinor, setIsMinor] = useState(false);
  const [useExistingGuardian, setUseExistingGuardian] = useState(false);

  // Usar los guardianes del usuario directamente desde el store
  const guardians: Guardian[] = useMemo(() => {
    const userGuardians = user?.guardiands || [];
    // Deduplicate by documentId to avoid React key errors
    const uniqueGuardians = Array.from(
      new Map(userGuardians.map((g) => [g.documentId, g])).values(),
    );
    return uniqueGuardians;
  }, [user?.guardiands]);

  // Pre-calcular si el usuario ya es menor basado en su fecha de nacimiento
  const userIsMinor = useMemo(() => {
    if (!user?.age) return false;
    try {
      const birthDate = new Date(user.age);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }
      return age < 18;
    } catch {
      return false;
    }
  }, [user?.age]);

  const [formData, setFormData] = useState<Partial<UploadDocumentsData>>({
    identityDocumentType: "dni",
    identityDocumentNumber: "",
    birthDate: "",
    guardianId: undefined,
    guardianData: undefined,
  });

  const [files, setFiles] = useState<{
    front: File | null;
    back: File | null;
  }>({
    front: null,
    back: null,
  });

  const [guardianFiles, setGuardianFiles] = useState<{
    front: File | null;
    back: File | null;
  }>({
    front: null,
    back: null,
  });

  const [newGuardianData, setNewGuardianData] = useState({
    name: "",
    lastName: "",
    email: "",
    DNI: "",
    phone: "",
    address: "",
    city: "",
    zipcode: "",
    country: "",
  });

  // Inicializar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen && user) {
      // Pre-llenar fecha de nacimiento si el usuario la tiene
      if (user.age) {
        const birthDateStr = new Date(user.age).toISOString().split("T")[0];
        setFormData((prev) => ({ ...prev, birthDate: birthDateStr }));
        setIsMinor(userIsMinor);
      }

      // Si tiene guardianes, seleccionar el primero por defecto
      if (guardians.length > 0) {
        setUseExistingGuardian(true);
        setFormData((prev) => ({
          ...prev,
          guardianId: guardians[0].documentId,
        }));
      }
    }
  }, [isOpen, user, userIsMinor, guardians]);

  useEffect(() => {
    // Si el usuario ya está identificado como menor por su perfil,
    // no cambiamos el estado isMinor basado en la fecha del documento (que será la del tutor)
    if (userIsMinor) {
      setIsMinor(true);
      return;
    }

    // Calcular si es menor de edad cuando cambia la fecha de nacimiento
    if (formData.birthDate) {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }
      setIsMinor(age < 18);
    }
  }, [formData.birthDate, userIsMinor]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardianDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewGuardianData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    side: "front" | "back",
  ) => {
    const file = e.target.files?.[0] || null;

    if (file) {
      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("El archivo no debe superar los 5MB");
        return;
      }

      // Validar formato
      const validFormats = ["image/jpeg", "image/png", "application/pdf"];
      if (!validFormats.includes(file.type)) {
        toast.error("Formato no permitido. Use JPG, PNG o PDF");
        return;
      }
    }

    setFiles((prev) => ({ ...prev, [side]: file }));
  };

  const handleGuardianFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    side: "front" | "back",
  ) => {
    const file = e.target.files?.[0] || null;

    if (file) {
      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("El archivo no debe superar los 5MB");
        return;
      }

      // Validar formato
      const validFormats = ["image/jpeg", "image/png", "application/pdf"];
      if (!validFormats.includes(file.type)) {
        toast.error("Formato no permitido. Use JPG, PNG o PDF");
        return;
      }
    }

    setGuardianFiles((prev) => ({ ...prev, [side]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.identityDocumentType ||
      !formData.identityDocumentNumber ||
      !formData.birthDate
    ) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }

    if (!files.front || !files.back) {
      toast.error("Debes subir ambas fotos del documento (frente y dorso)");
      return;
    }

    if (isMinor && useExistingGuardian && !formData.guardianId) {
      toast.error("Debes seleccionar un guardián");
      return;
    }

    if (isMinor && !useExistingGuardian) {
      if (
        !newGuardianData.name ||
        !newGuardianData.lastName ||
        !newGuardianData.email ||
        !newGuardianData.DNI
      ) {
        toast.error("Completa los datos del guardián");
        return;
      }
    }

    // Validar documentos del guardián si es menor
    if (isMinor && (!guardianFiles.front || !guardianFiles.back)) {
      toast.error(
        "Debes subir ambas fotos del documento del guardián (frente y dorso)",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadData: UploadDocumentsData = {
        identityDocumentType: formData.identityDocumentType!,
        identityDocumentNumber: formData.identityDocumentNumber!,
        birthDate: formData.birthDate!,
      };

      // Agregar guardián si es menor
      if (isMinor) {
        if (useExistingGuardian && formData.guardianId) {
          uploadData.guardianId = formData.guardianId;
        } else {
          uploadData.guardianData = newGuardianData;
        }
      }

      // Agregar archivos del usuario
      if (files.front) uploadData.identityDocumentFront = files.front;
      if (files.back) uploadData.identityDocumentBack = files.back;

      // Agregar archivos del guardián si es menor
      if (isMinor) {
        if (guardianFiles.front)
          uploadData.guardianDocumentFront = guardianFiles.front;
        if (guardianFiles.back)
          uploadData.guardianDocumentBack = guardianFiles.back;
      }

      await RewardClaimService.uploadDocuments(claimCode, uploadData);

      toast.success(
        "Documentos recibidos",
        "Tu reclamo está en espera de verificación.",
      );

      onSuccess?.();
      onClose();
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { error?: { message?: string } } };
      };
      const errorMessage =
        axiosError?.response?.data?.error?.message ||
        "Error al subir los documentos. Intenta nuevamente.";
      toast.error("Error al subir los documentos", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Verificación de Identidad</DialogTitle>
          <DialogDescription>
            Para completar tu reclamo, necesitamos verificar tu identidad.
          </DialogDescription>
        </DialogHeader>

        {/* Aviso si ya se detectó que es menor */}
        {userIsMinor && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
            <div className="text-xs">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                Eres menor de edad
              </p>
              <p className="text-yellow-600 dark:text-yellow-400 mt-0.5">
                {guardians.length > 0 ? (
                  <span className="flex items-center gap-1">
                    <UserCheck className="h-3 w-3" />
                    Hay {guardians.length} responsables registrados. Puedes
                    elegir uno o agregar otro.
                  </span>
                ) : (
                  "Debes registrar datos de una persona responsable para autorizar el reclamo."
                )}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de Documento */}
          <div>
            <Label htmlFor="identityDocumentType">Tu Tipo de Documento *</Label>
            <Select
              value={formData.identityDocumentType}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  identityDocumentType: value as IdentityDocumentType,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dni">DNI</SelectItem>
                <SelectItem value="passport">Pasaporte</SelectItem>
                <SelectItem value="id_card">Tarjeta de Identidad</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Número de Documento */}
          <div>
            <Label htmlFor="identityDocumentNumber">
              Tu Número de Documento *
            </Label>
            <Input
              id="identityDocumentNumber"
              name="identityDocumentNumber"
              value={formData.identityDocumentNumber}
              onChange={handleInputChange}
              required
              placeholder="12345678A"
            />
          </div>

          {/* Fecha de Nacimiento */}
          <div>
            <Label htmlFor="birthDate">Tu Fecha de Nacimiento *</Label>
            <DatePicker
              id="birthDate"
              name="birthDate"
              value={formData.birthDate}
              onChange={(date) =>
                setFormData((prev) => ({
                  ...prev,
                  birthDate: date ? date.toISOString().split("T")[0] : "",
                }))
              }
              placeholder="Selecciona fecha"
            />
            {isMinor && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                Eres menor de edad. Se requiere autorización de una persona
                responsable.
              </p>
            )}
          </div>

          {/* Upload Documentos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="frontFile">Documento Frente *</Label>
              <div className="mt-1">
                <Input
                  id="frontFile"
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={(e) => handleFileChange(e, "front")}
                />
                {files.front && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <FileText className="h-3 w-3 inline mr-1" />
                    {files.front.name}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="backFile">Documento Dorso *</Label>
              <div className="mt-1">
                <Input
                  id="backFile"
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={(e) => handleFileChange(e, "back")}
                />
                {files.back && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <FileText className="h-3 w-3 inline mr-1" />
                    {files.back.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sección de Guardián (solo si es menor) */}
          {isMinor && (
            <div className="border-t pt-4 space-y-4">
              <h3 className="font-medium">Datos del responsable</h3>

              {guardians.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={useExistingGuardian ? "default" : "outline"}
                    onClick={() => setUseExistingGuardian(true)}
                    size="sm"
                  >
                    Usar responsable registrado
                  </Button>
                  <Button
                    type="button"
                    variant={!useExistingGuardian ? "default" : "outline"}
                    onClick={() => setUseExistingGuardian(false)}
                    size="sm"
                  >
                    Agregar nuevo responsable
                  </Button>
                </div>
              )}

              {useExistingGuardian && guardians.length > 0 ? (
                <div>
                  <Label htmlFor="guardianId">Seleccionar responsable *</Label>
                  <Select
                    value={formData.guardianId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, guardianId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Elegí responsable" />
                    </SelectTrigger>
                    <SelectContent>
                      {guardians.map((guardian) => (
                        <SelectItem
                          key={guardian.documentId}
                          value={guardian.documentId}
                        >
                          {guardian.name} {guardian.lastName} - {guardian.DNI}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="guardianName">Nombre *</Label>
                      <Input
                        id="guardianName"
                        name="name"
                        value={newGuardianData.name}
                        onChange={handleGuardianDataChange}
                        required={isMinor && !useExistingGuardian}
                      />
                    </div>
                    <div>
                      <Label htmlFor="guardianLastName">Apellidos *</Label>
                      <Input
                        id="guardianLastName"
                        name="lastName"
                        value={newGuardianData.lastName}
                        onChange={handleGuardianDataChange}
                        required={isMinor && !useExistingGuardian}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="guardianEmail">Email *</Label>
                      <Input
                        id="guardianEmail"
                        name="email"
                        type="email"
                        value={newGuardianData.email}
                        onChange={handleGuardianDataChange}
                        required={isMinor && !useExistingGuardian}
                      />
                    </div>
                    <div>
                      <Label htmlFor="guardianDNI">
                        Documento de identidad del responsable *
                      </Label>
                      <Input
                        id="guardianDNI"
                        name="DNI"
                        value={newGuardianData.DNI}
                        onChange={handleGuardianDataChange}
                        required={isMinor && !useExistingGuardian}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Documentos del responsable */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="guardianFrontFile">
                      Documento Frente *
                    </Label>
                    <div className="mt-1">
                      <Input
                        id="guardianFrontFile"
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        onChange={(e) => handleGuardianFileChange(e, "front")}
                      />
                      {guardianFiles.front && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <FileText className="h-3 w-3 inline mr-1" />
                          {guardianFiles.front.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="guardianBackFile">Documento Dorso *</Label>
                    <div className="mt-1">
                      <Input
                        id="guardianBackFile"
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        onChange={(e) => handleGuardianFileChange(e, "back")}
                      />
                      {guardianFiles.back && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <FileText className="h-3 w-3 inline mr-1" />
                          {guardianFiles.back.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Documentos
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
