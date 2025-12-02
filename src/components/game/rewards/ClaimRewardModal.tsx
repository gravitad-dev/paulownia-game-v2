"use client";

import { AddressAutocomplete } from "@/components/address/AddressAutocomplete";
import { CountrySelect } from "@/components/profile/CountrySelect";
import { PhoneInput } from "@/components/profile/PhoneInput";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";
import { getCountryCode, getCountryName } from "@/lib/countries";
import { RewardClaimService } from "@/services/reward-claim.service";
import { useAuthStore } from "@/store/useAuthStore";
import type { AddressSuggestion } from "@/types/address";
import type { UserRewardDetailed } from "@/types/reward";
import type { CreateClaimData } from "@/types/reward-claim";
import { CountryCode } from "libphonenumber-js";
import { Gift, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface ClaimRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userReward: UserRewardDetailed;
  onSuccess?: () => void;
}

export function ClaimRewardModal({
  isOpen,
  onClose,
  userReward,
  onSuccess,
}: ClaimRewardModalProps) {
  const { user } = useAuthStore();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calcular si el usuario es menor de edad
  const isMinor = useMemo(() => {
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

  // Estado del formulario
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [dataProcessingAccepted, setDataProcessingAccepted] = useState(false);

  // Estado de dirección
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [isAddressValidated, setIsAddressValidated] = useState(false);

  // Inicializar con datos del usuario cuando abre el modal
  useEffect(() => {
    if (isOpen && user) {
      setFullName(
        user.name && user.lastname
          ? `${user.name} ${user.lastname}`
          : user.username || "",
      );
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setCountry(user.country || "");
      setAddress(user.address || "");
      setCity(user.city || "");
      setZipcode(user.zipcode || "");
      setIsAddressValidated(!!user.address);
    }
  }, [isOpen, user]);

  // Handler para selección de dirección del autocomplete
  const handleAddressSelect = useCallback((suggestion: AddressSuggestion) => {
    setAddress(suggestion.address.address);
    setCity(suggestion.address.city || "");
    setZipcode(suggestion.address.zipcode || "");
    setIsAddressValidated(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!termsAccepted || !dataProcessingAccepted) {
      toast.error("Debes aceptar los términos y el procesamiento de datos");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Crear el reclamo
      const claimData: CreateClaimData = {
        userRewardId: userReward.uuid,
        fullName,
        email,
        phone,
        address,
        city,
        zipCode: zipcode,
        country,
        additionalNotes,
        termsAccepted,
        dataProcessingAccepted,
      };

      const response = await RewardClaimService.createClaim(claimData);
      const claimCode = response.data.claimCode;

      // NOTA: Ya no subimos documentos aquí.
      // Si es menor, el backend devuelve isMinor=true y el estado pending.
      // El usuario deberá usar el botón "Subir Documentos" en el detalle o ser redirigido.

      toast.success("Reclamo creado exitosamente", `Código: ${claimCode}`);

      // Mostrar mensaje de documentación requerida (para todos los usuarios)
      setTimeout(() => {
        toast.info(
          "Documentación requerida",
          isMinor
            ? "Por favor sube tu documentación y la del tutor para continuar."
            : "Por favor sube tu documentación de identidad para continuar.",
        );
      }, 1000);

      onSuccess?.();
      onClose();
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { error?: { message?: string } } };
      };
      const errorMessage =
        axiosError?.response?.data?.error?.message ||
        "Error al crear el reclamo. Intenta nuevamente.";
      toast.error("Error al crear el reclamo", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form state
    setFullName("");
    setEmail("");
    setPhone("");
    setAdditionalNotes("");
    setTermsAccepted(false);
    setDataProcessingAccepted(false);
    setCountry("");
    setAddress("");
    setCity("");
    setZipcode("");
    setIsAddressValidated(false);

    onClose();
  };

  // Suprimir warning de variable no usada (se usará para validación futura)
  void isAddressValidated;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Gift className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg">Reclamar Premio</DialogTitle>
              <DialogDescription className="text-sm">
                {userReward.reward.name}
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex gap-1">
              {/* Barra de progreso eliminada al ser un solo paso */}
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 min-h-[300px]">
          {/* PASO 1: Información de Envío */}
          <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="fullName" className="text-xs">
                  Nombre Completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fullName"
                  value={fullName}
                  readOnly
                  className="h-9 bg-muted cursor-not-allowed"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  readOnly
                  className="h-9 bg-muted cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">
                  País <span className="text-destructive">*</span>
                </Label>
                <CountrySelect
                  value={country}
                  onChange={setCountry}
                  disabled={isSubmitting}
                  compact
                  small
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">
                  Teléfono <span className="text-destructive">*</span>
                </Label>
                <PhoneInput
                  id="claim-phone"
                  name="phone"
                  value={phone}
                  onChange={setPhone}
                  onCountryChange={(countryCode) => {
                    const countryName = getCountryName(countryCode);
                    if (countryName) {
                      setCountry(countryName);
                    }
                  }}
                  disabled={isSubmitting}
                  defaultCountry={
                    (country
                      ? (getCountryCode(country) as CountryCode | undefined)
                      : undefined) || "ES"
                  }
                  compact
                  small
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">
                Dirección <span className="text-destructive">*</span>
              </Label>
              <AddressAutocomplete
                value={address}
                onChange={(value) => {
                  setAddress(value);
                  setIsAddressValidated(false);
                }}
                onSuggestionSelect={handleAddressSelect}
                countryCode={country ? getCountryCode(country) : undefined}
                disabled={isSubmitting || !country}
                placeholder={
                  country
                    ? "Escribe tu dirección..."
                    : "Selecciona un país primero"
                }
                label=""
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="city" className="text-xs">
                  Ciudad <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  placeholder="Ciudad"
                  className="h-9"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="zipcode" className="text-xs">
                  Código Postal
                </Label>
                <Input
                  id="zipcode"
                  value={zipcode}
                  onChange={(e) => setZipcode(e.target.value)}
                  placeholder="12345"
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="additionalNotes" className="text-xs">
                Notas (Opcional)
              </Label>
              <textarea
                id="additionalNotes"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Instrucciones de entrega, horarios, etc."
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </div>

            {/* Términos y Condiciones (Movido aquí) */}
            <div className="space-y-3 pt-2 border-t mt-2">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="termsAccepted"
                  checked={termsAccepted}
                  onCheckedChange={(checked) =>
                    setTermsAccepted(checked as boolean)
                  }
                  className="mt-0.5"
                />
                <label
                  htmlFor="termsAccepted"
                  className="text-xs cursor-pointer leading-tight"
                >
                  Acepto los{" "}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    términos y condiciones
                  </a>{" "}
                  del servicio y las reglas del sorteo.
                  <span className="text-destructive ml-0.5">*</span>
                </label>
              </div>

              <div className="flex items-start gap-2">
                <Checkbox
                  id="dataProcessingAccepted"
                  checked={dataProcessingAccepted}
                  onCheckedChange={(checked) =>
                    setDataProcessingAccepted(checked as boolean)
                  }
                  className="mt-0.5"
                />
                <label
                  htmlFor="dataProcessingAccepted"
                  className="text-xs cursor-pointer leading-tight"
                >
                  Doy mi consentimiento para el procesamiento de mis datos
                  personales según la{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    política de privacidad
                  </a>
                  .<span className="text-destructive ml-0.5">*</span>
                </label>
              </div>
            </div>
          </div>

          {/* Botones de Navegación */}
          <div className="flex gap-3 pt-4 border-t mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={
                isSubmitting || !termsAccepted || !dataProcessingAccepted
              }
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Confirmar Reclamo"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
