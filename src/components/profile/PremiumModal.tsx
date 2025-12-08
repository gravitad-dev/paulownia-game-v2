"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PremiumError, PremiumService } from "@/services/premium.service";
import { getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2, Star } from "lucide-react";
import { useToast } from "@/hooks/useToast";

export function PremiumModal() {
  const { user, updateUser } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const cleanCode = code.trim();

    if (!cleanCode) {
      toast.error("Por favor ingresa un código.");
      return;
    }

    // Validación básica de formato
    if (cleanCode.length !== 24) {
      toast.error("El código debe tener 24 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const res = await PremiumService.redeemCode(cleanCode);

      updateUser({ isPremium: true });
      // Ignoramos el mensaje del backend para asegurar que sea en español y amigable
      toast.success(
        "¡Enhorabuena! Tu cuenta Premium se ha activado correctamente.",
      );

      setTimeout(() => {
        setOpen(false);
        setCode("");
      }, 1200);
    } catch (err: unknown) {
      if (err instanceof PremiumError) {
        switch (err.code) {
          case "MISSING_CODE":
            toast.error("Por favor ingresa un código.");
            break;
          case "INVALID_CODE":
            toast.error("El código ingresado no es válido o ya fue usado.");
            break;
          case "ALREADY_PREMIUM":
            toast.info("¡Ya eres un usuario Premium!");
            setTimeout(() => setOpen(false), 1500);
            break;
          case "USER_NOT_FOUND":
            toast.error("Error de sesión. Por favor ingresa nuevamente.");
            break;
          default:
            toast.error("Ocurrió un error al canjear el código.");
        }
      } else {
        const msg = getErrorMessage(err);
        toast.error(msg || "Ocurrió un error inesperado. Intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permitir pegar código con espacios y limpiarlos
    const v = e.target.value.replace(/\s/g, "");
    setCode(v);
  };

  // If user is already premium, show a non-interactive badge instead of trigger
  if (user?.isPremium) {
    return (
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-2 rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-amber-600 text-sm font-semibold">
          <Star className="h-4 w-4 text-amber-500" />
          Premium
        </div>
      </div>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setCode("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <Star className="h-4 w-4" />
          Habilitar Premium
        </Button>
      </DialogTrigger>

      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Activar Premium</DialogTitle>
            <DialogDescription>
              Introduce el código para activar tu cuenta Premium.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="premiumCode">Código</Label>
              <Input
                id="premiumCode"
                name="premiumCode"
                value={code}
                onChange={handleCodeChange}
                required
                disabled={loading}
                placeholder="Ingresa tu código de 24 caracteres"
                maxLength={24}
                className="font-mono"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || code.length !== 24}
              className="gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Canjear código
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
