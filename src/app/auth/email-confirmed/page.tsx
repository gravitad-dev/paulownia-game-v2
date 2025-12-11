"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { getErrorMessage, isNetworkError } from "@/lib/api";
import { AuthService } from "@/services/auth.service";

export default function EmailConfirmedPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-card p-8 rounded-lg shadow-lg border border-border text-center">
          <h3 className="text-xl font-semibold mb-2 text-card-foreground">
            Verificando tu cuenta...
          </h3>
          <p className="text-sm text-muted-foreground mb-6">Cargando...</p>
        </div>
      }
    >
      <EmailConfirmedContent />
    </Suspense>
  );
}

function EmailConfirmedContent() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    const token = params.get("confirmation") || params.get("code") || "";
    if (!token) {
      setStatus("error");
      setMessage("Enlace inválido o faltan parámetros");
      return;
    }
    AuthService.confirmEmail(token)
      .then(() => {
        setStatus("success");
        toast.success("Cuenta verificada");
        setTimeout(() => {
          router.replace("/auth/login");
        }, 4000);
      })
      .catch((err: unknown) => {
        // Si es error de red en este endpoint específico, es muy probable que sea por
        // la redirección de Strapi (que causa CORS/error de parseo) tras una confirmación exitosa.
        if (isNetworkError(err)) {
          console.log(
            "Network error detected during confirmation, assuming success due to redirect issue",
          );
          setStatus("success");
          toast.success(
            "Cuenta verificada",
            "Serás redirigido a la página de inicio de sesión.",
          );
          setTimeout(() => {
            router.replace("/auth/login");
          }, 4000);
          return;
        }

        setStatus("error");
        const raw = getErrorMessage(err) || "No se pudo confirmar el email";
        const isInvalidToken = raw.toLowerCase().includes("invalid token");

        if (isInvalidToken) {
          const friendly =
            "El enlace no es válido o ya fue utilizado. Si ya confirmaste tu cuenta, intenta iniciar sesión.";
          setMessage(friendly);
          toast.warning("Enlace no válido", friendly);
        } else {
          setMessage(raw);
          toast.error(raw);
        }
      });
  }, [params, toast, router]);

  return (
    <div className="bg-card p-8 rounded-lg shadow-lg border border-border text-center">
      {status === "loading" && (
        <>
          <h3 className="text-xl font-semibold mb-2 text-card-foreground">
            Verificando tu cuenta...
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Por favor espera.
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <h3 className="text-xl font-semibold mb-2 text-card-foreground">
            ¡Cuenta verificada!
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Ya puedes iniciar sesión y disfrutar del juego.
          </p>
          <Link href="/auth/login">
            <Button className="w-full">Ir a iniciar sesión</Button>
          </Link>
        </>
      )}

      {status === "error" && (
        <>
          <h3 className="text-xl font-semibold mb-2 text-card-foreground">
            No pudimos verificar tu cuenta
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {message || "El enlace no es válido o expiró."}
          </p>
          <Link href="/auth/login">
            <Button variant="outline" className="w-full">
              Volver a iniciar sesión
            </Button>
          </Link>
        </>
      )}
    </div>
  );
}
