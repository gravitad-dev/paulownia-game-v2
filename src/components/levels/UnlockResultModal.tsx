"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface UnlockResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  success: boolean;
  message: string;
}

export function UnlockResultModal({
  open,
  onOpenChange,
  success,
  message,
}: UnlockResultModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                success
                  ? "bg-green-100 dark:bg-green-900/20"
                  : "bg-red-100 dark:bg-red-900/20"
              )}
            >
              {success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
            </div>
            <DialogTitle>
              {success ? "Nivel Desbloqueado" : "Error al Desbloquear"}
            </DialogTitle>
          </div>
          <DialogDescription className="pt-2">{message}</DialogDescription>
        </DialogHeader>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>
            {success ? "Continuar" : "Cerrar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

