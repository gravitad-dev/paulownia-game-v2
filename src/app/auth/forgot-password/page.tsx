"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { AuthService } from "@/services/auth.service";
import { getErrorMessage, isApiError } from "@/lib/api";

import Cookies from "js-cookie";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Ingresa tu email");
      return;
    }
    setLoading(true);
    try {
      await AuthService.forgotPassword(email.trim());
      // Limpiar datos de sesión local por seguridad si el usuario solicitó resetear pass
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
        Cookies.remove("auth_token");
        Cookies.remove("auth_token", { path: "/" });
        // Intentar eliminar también la cookie HTTP-only del servidor si existe (aunque no es accesible por JS)
        // forzando una expiración en el dominio actual
        document.cookie =
          "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      }
      toast.success(
        "Te enviamos un correo para recuperar tu contraseña",
        "Revisa tu bandeja de entrada y spam",
      );
      setSent(true);
      setCooldown(30);
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      if (
        isApiError(err) &&
        err.status === 400 &&
        (message === "User not found" ||
          message === "This email does not exist")
      ) {
        toast.error(
          "No encontramos una cuenta con ese email",
          "Verifica que esté bien escrito o regístrate",
        );
      } else {
        toast.error(
          message || "No pudimos enviar el correo. Intenta más tarde.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!sent || cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [sent, cooldown]);

  const handleResend = async () => {
    if (!email.trim() || cooldown > 0) return;
    setLoading(true);
    try {
      await AuthService.forgotPassword(email.trim());
      toast.info(
        "Te reenviamos el correo",
        "Revisa tu bandeja de entrada y spam",
      );
      setCooldown(30);
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      if (
        isApiError(err) &&
        err.status === 400 &&
        (message === "User not found" ||
          message === "This email does not exist")
      ) {
        toast.error(
          "No encontramos una cuenta con ese email",
          "Verifica que esté bien escrito o regístrate",
        );
      } else {
        toast.error(
          message || "No pudimos enviar el correo. Intenta más tarde.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card p-8 rounded-lg shadow-lg border border-border">
      <h3 className="text-xl font-semibold mb-6 text-center text-card-foreground">
        Recuperar contraseña
      </h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-muted-foreground"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 block w-full rounded-md border border-input bg-input px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={sent}
          />
        </div>

        <Button
          type="submit"
          disabled={loading || sent}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            cursor: sent ? "not-allowed" : "pointer",
          }}
        >
          {sent ? "Correo enviado" : loading ? "Enviando..." : "Enviar correo"}
        </Button>
      </form>

      {sent && (
        <div className="mt-4 rounded-md border border-border bg-muted/30 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Te enviamos instrucciones a {email}. Revisa tu bandeja de entrada.
            Si no lo encuentras, verifica tu spam.
          </p>
          <Button
            variant="default"
            className="mt-3 w-full"
            onClick={handleResend}
            disabled={cooldown > 0 || loading}
          >
            {cooldown > 0 ? `Reenviar en ${cooldown}s` : "Reenviar correo"}
          </Button>
        </div>
      )}

      <div className="mt-6 text-center text-sm">
        <span className="text-muted-foreground">
          ¿Ya recordaste tu contraseña?{" "}
        </span>
        <Link
          href="/auth/login"
          className="font-medium text-primary hover:text-primary/80"
        >
          Inicia sesión
        </Link>
      </div>
    </div>
  );
}
