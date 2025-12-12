"use client";

import { useState, useEffect } from "react";
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
import { AuthService } from "@/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import { Loader2, Lock, Mail } from "lucide-react";
import { getErrorMessage } from "@/lib/api";

export function ChangePasswordModal() {
  const user = useAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Timer for cooldown
  useEffect(() => {
    if (!sent || cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [sent, cooldown]);

  const handleSendEmail = async () => {
    if (!user?.email) {
      setMessage({
        type: "error",
        text: "No se encontró el email del usuario.",
      });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      await AuthService.forgotPassword(user.email);
      setSent(true);
      setCooldown(60); // 60 seconds cooldown
      setMessage({
        type: "success",
        text: "Correo enviado correctamente. Revisa tu bandeja de entrada.",
      });
    } catch (error: unknown) {
      console.error("[ChangePasswordModal] Error:", error);
      const errorMessage =
        getErrorMessage(error) || "No se pudo enviar el correo.";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          // Optional: reset state on close
          // resetState();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Lock className="h-4 w-4" />
          Cambiar contraseña
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar contraseña</DialogTitle>
          <DialogDescription>
            Por seguridad, para cambiar tu contraseña te enviaremos un enlace a
            tu correo electrónico registrado.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
            <div className="bg-background p-2 rounded-full border border-border">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Enviar a
              </p>
              <p className="text-sm font-medium truncate" title={user?.email}>
                {user?.email || "Email no disponible"}
              </p>
            </div>
          </div>

          {message && (
            <div
              className={`rounded-md border px-3 py-2 text-sm ${
                message.type === "success"
                  ? "border-success/40 bg-success/10 text-success"
                  : "border-destructive/40 bg-destructive/5 text-destructive"
              }`}
            >
              {message.text}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            {sent ? "Cerrar" : "Cancelar"}
          </Button>

          <Button
            onClick={handleSendEmail}
            disabled={loading || (sent && cooldown > 0) || !user?.email}
            className="gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {sent
              ? cooldown > 0
                ? `Reenviar en ${cooldown}s`
                : "Reenviar correo"
              : "Enviar correo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
