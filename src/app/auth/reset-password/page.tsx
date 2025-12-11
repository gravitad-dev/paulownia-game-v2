"use client";

import Link from "next/link";
import { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { AuthService } from "@/services/auth.service";
import { useAuthStore } from "@/store/useAuthStore";
import { Eye, EyeOff } from "lucide-react";
import { gsap } from "gsap";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-card p-8 rounded-lg shadow-lg border border-border text-center">
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const login = useAuthStore((s) => s.login);

  const [code, setCode] = useState<string>("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const c = params.get("code") || "";
    setCode(c);
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      toast.error("Código inválido o ausente en la URL");
      return;
    }
    if (!password || !passwordConfirmation) {
      toast.error("Completa ambos campos de contraseña");
      if (formRef.current) {
        gsap.to(formRef.current, {
          x: -10,
          duration: 0.1,
          repeat: 5,
          yoyo: true,
          ease: "power2.inOut",
        });
      }
      return;
    }

    // Validación de fortaleza de contraseña
    const passwordPolicy = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordPolicy.test(password)) {
      toast.error(
        "Contraseña inválida",
        "Debe tener 8+ caracteres, una mayúscula y un número",
      );
      if (passwordInputRef.current) {
        passwordInputRef.current.focus();
      }
      if (formRef.current) {
        gsap.to(formRef.current, {
          x: -10,
          duration: 0.1,
          repeat: 5,
          yoyo: true,
          ease: "power2.inOut",
        });
      }
      return;
    }

    if (password !== passwordConfirmation) {
      toast.error(
        "Las contraseñas no coinciden.",
        "Por favor, vuelve a intentarlo.",
      );
      if (confirmPasswordInputRef.current) {
        confirmPasswordInputRef.current.focus();
      }
      if (formRef.current) {
        gsap.to(formRef.current, {
          x: -10,
          duration: 0.1,
          repeat: 5,
          yoyo: true,
          ease: "power2.inOut",
        });
      }
      return;
    }
    setLoading(true);
    try {
      const { jwt, user } = await AuthService.resetPassword(
        code,
        password,
        passwordConfirmation,
      );
      login(user, jwt, true);
      toast.success(
        "Contraseña restablecida",
        "Has iniciado sesión automáticamente",
      );
      router.push("/game");
    } catch (err: unknown) {
      let message =
        (
          err as {
            response?: { data?: { error?: { message?: string } } };
          }
        )?.response?.data?.error?.message ||
        (err as { message?: string })?.message ||
        "No pudimos restablecer la contraseña. Intenta nuevamente.";

      if (message === "Incorrect code provided") {
        message =
          "El enlace de restablecimiento es inválido o ha expirado. Por favor solicita uno nuevo.";
      }

      toast.error(message);

      if (formRef.current) {
        gsap.to(formRef.current, {
          x: -10,
          duration: 0.1,
          repeat: 5,
          yoyo: true,
          ease: "power2.inOut",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={formRef}
      className="bg-card p-8 rounded-lg shadow-lg border border-border"
    >
      <h3 className="text-xl font-semibold mb-6 text-center text-card-foreground">
        Restablecer contraseña
      </h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-muted-foreground">
            Nueva contraseña
          </label>
          <div className="relative mt-1">
            <input
              type={showPassword ? "text" : "password"}
              required
              className="block w-full rounded-md border border-input bg-input px-3 py-2 pr-10 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              ref={passwordInputRef}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Eye className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground">
            Confirmar contraseña
          </label>
          <div className="relative mt-1">
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              className="block w-full rounded-md border border-input bg-input px-3 py-2 pr-10 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              minLength={8}
              ref={confirmPasswordInputRef}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Eye className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Restableciendo..." : "Guardar contraseña"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        <Link
          href="/auth/login"
          className="font-medium text-primary hover:text-primary/80"
        >
          Volver a iniciar sesión
        </Link>
      </div>
    </div>
  );
}
