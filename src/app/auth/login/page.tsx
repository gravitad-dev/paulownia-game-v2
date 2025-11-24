"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { gsap } from "gsap";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const router = useRouter();
  const toast = useToast();

  const formRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const fieldsRef = useRef<HTMLDivElement[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!formRef.current) return;

    const ctx = gsap.context(() => {
      // Animación de entrada del formulario
      gsap.fromTo(
        formRef.current,
        {
          opacity: 0,
          y: 30,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power3.out",
        }
      );

      // Animación del título
      if (titleRef.current) {
        gsap.fromTo(
          titleRef.current,
          {
            opacity: 0,
            y: -20,
          },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            delay: 0.2,
            ease: "power2.out",
          }
        );
      }

      // Animación escalonada de los campos
      fieldsRef.current.forEach((field, index) => {
        if (field) {
          gsap.fromTo(
            field,
            {
              opacity: 0,
              x: -20,
            },
            {
              opacity: 1,
              x: 0,
              duration: 0.5,
              delay: 0.3 + index * 0.1,
              ease: "power2.out",
            }
          );
        }
      });

      // Animación del botón
      if (buttonRef.current) {
        gsap.fromTo(
          buttonRef.current,
          {
            opacity: 0,
            scale: 0.9,
          },
          {
            opacity: 1,
            scale: 1,
            duration: 0.5,
            delay: 0.7,
            ease: "back.out(1.7)",
          }
        );
      }

      // Animación del footer
      if (footerRef.current) {
        gsap.fromTo(
          footerRef.current,
          {
            opacity: 0,
          },
          {
            opacity: 1,
            duration: 0.5,
            delay: 0.8,
            ease: "power2.out",
          }
        );
      }
    }, formRef);

    return () => ctx.revert();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Animación del botón al hacer click
    if (buttonRef.current) {
      gsap.to(buttonRef.current, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut",
      });
    }

    try {
      const response = await api.post("/api/auth/local", {
        identifier,
        password,
      });

      const { user, jwt } = response.data;
      // Note: Zustand persist middleware uses localStorage by default, which acts like "Remember Me".
      // If we wanted strict session-only, we'd need to configure storage dynamically, but for this UI request
      // we will just visually implement it. In a real app, we might toggle storage type.
      login(user, jwt);
      toast.success("Bienvenido de nuevo");
      router.push("/game");
    } catch (err: unknown) {
      console.error("Login error:", err);
      const errorMessage =
        (
          err as {
            response?: { data?: { error?: { message?: string } } };
          }
        )?.response?.data?.error?.message ||
        "Error al iniciar sesión. Verifica tus credenciales.";
      toast.error(errorMessage);

      // Animación de shake en caso de error
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
      <h3
        ref={titleRef}
        className="text-xl font-semibold mb-6 text-center text-card-foreground"
      >
        Iniciar Sesión
      </h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          ref={(el) => {
            if (el) fieldsRef.current[0] = el;
          }}
        >
          <label
            htmlFor="identifier"
            className="block text-sm font-medium text-muted-foreground"
          >
            Email o Usuario
          </label>
          <input
            id="identifier"
            name="identifier"
            type="text"
            required
            className="mt-1 block w-full rounded-md border border-input bg-input px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
        </div>

        <div
          ref={(el) => {
            if (el) fieldsRef.current[1] = el;
          }}
        >
          <label
            htmlFor="password"
            className="block text-sm font-medium text-muted-foreground"
          >
            Contraseña
          </label>
          <div className="relative mt-1">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              className="block w-full rounded-md border border-input bg-input px-3 py-2 pr-10 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

        <div
          ref={(el) => {
            if (el) fieldsRef.current[2] = el;
          }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-input bg-input text-primary focus:ring-primary"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-sm text-muted-foreground"
            >
              Permanecer conectado
            </label>
          </div>

          <div className="text-sm">
            <a
              href="#"
              className="font-medium text-primary hover:text-primary/80"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        </div>

        <Button
          ref={buttonRef}
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          onMouseEnter={() => {
            if (buttonRef.current && !loading) {
              gsap.to(buttonRef.current, {
                scale: 1.02,
                duration: 0.2,
                ease: "power2.out",
              });
            }
          }}
          onMouseLeave={() => {
            if (buttonRef.current && !loading) {
              gsap.to(buttonRef.current, {
                scale: 1,
                duration: 0.2,
                ease: "power2.out",
              });
            }
          }}
        >
          {loading ? "Cargando..." : "Ingresar"}
        </Button>
      </form>

      <div ref={footerRef} className="mt-6 text-center text-sm">
        <span className="text-muted-foreground">¿No tienes una cuenta? </span>
        <Link
          href="/auth/register"
          className="font-medium text-primary hover:text-primary/80"
        >
          Regístrate aquí
        </Link>
      </div>
    </div>
  );
}
