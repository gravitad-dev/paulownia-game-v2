"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, ArrowRight, Star } from "lucide-react";
import { useRouter } from "next/navigation";

interface PremiumAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export function PremiumAccessModal({
  open,
  onOpenChange,
  title = "Acceso Exclusivo Premium",
  description = "Esta función es exclusiva para usuarios Premium. Mejora tu cuenta para desbloquear recompensas exclusivas, acceso ilimitado y mucho más.",
}: PremiumAccessModalProps) {
  const router = useRouter();

  const handleGoToSettings = () => {
    onOpenChange(false);
    // Redirigir a la pestaña de configuración del perfil donde está la opción de Premium
    router.push("/game/profile/settings");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto bg-amber-100 p-3 rounded-full mb-4 w-fit">
            <Crown className="h-8 w-8 text-amber-600" />
          </div>
          <DialogTitle className="text-center text-xl">{title}</DialogTitle>
          <DialogDescription className="text-center pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-3 p-3 bg-amber-50/50 rounded-lg border border-amber-100">
            <Star className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-900">
              Desbloquea la Ruleta de Premios exclusivos
            </p>
          </div>
          <div className="flex items-center gap-3 p-3 bg-amber-50/50 rounded-lg border border-amber-100">
            <Star className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-900">
              Acceso prioritario a nuevos eventos
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            className="w-full gap-2"
            onClick={handleGoToSettings}
            size="lg"
          >
            Activar Premium
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Quizás más tarde
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
