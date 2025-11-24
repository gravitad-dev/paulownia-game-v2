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

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
            delay: 0.9,
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
            delay: 1.0,
            ease: "power2.out",
          }
        );
      }
    }, formRef);

    return () => ctx.revert();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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

    if (formData.password !== formData.confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      setLoading(false);
      
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
      return;
    }

    try {
      const response = await api.post("/api/auth/local/register", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      const { user, jwt } = response.data;
      login(user, jwt);
      toast.success("Registro exitoso, bienvenido");
      router.push("/game");
    } catch (err: unknown) {
      console.error("Register error:", err);
      const errorMessage =
        (
          err as {
            response?: { data?: { error?: { message?: string } } };
          }
        )?.response?.data?.error?.message ||
        "Error al registrarse. Inténtalo de nuevo.";
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
      className="bg-card p-8 rounded-lg shadow-lg border border-border w-full max-w-md mx-auto"
    >
      <h3
        ref={titleRef}
        className="text-xl font-semibold mb-6 text-center text-card-foreground"
      >
        Crear Cuenta
      </h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div
          ref={(el) => {
            if (el) fieldsRef.current[0] = el;
          }}
        >
          <label className="block text-sm font-medium text-muted-foreground">
            Usuario *
          </label>
          <input
            name="username"
            type="text"
            required
            className="mt-1 block w-full rounded-md border border-input bg-input px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
            value={formData.username}
            onChange={handleChange}
          />
        </div>
        <div
          ref={(el) => {
            if (el) fieldsRef.current[1] = el;
          }}
        >
          <label className="block text-sm font-medium text-muted-foreground">
            Email *
          </label>
          <input
            name="email"
            type="email"
            required
            className="mt-1 block w-full rounded-md border border-input bg-input px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
            value={formData.email}
            onChange={handleChange}
          />
        </div>
        <div
          ref={(el) => {
            if (el) fieldsRef.current[2] = el;
          }}
        >
          <label className="block text-sm font-medium text-muted-foreground">
            Contraseña *
          </label>
          <div className="relative mt-1">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              required
              className="block w-full rounded-md border border-input bg-input px-3 py-2 pr-10 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
              value={formData.password}
              onChange={handleChange}
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
            if (el) fieldsRef.current[3] = el;
          }}
        >
          <label className="block text-sm font-medium text-muted-foreground">
            Confirmar Contraseña *
          </label>
          <div className="relative mt-1">
            <input
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              required
              className="block w-full rounded-md border border-input bg-input px-3 py-2 pr-10 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
              value={formData.confirmPassword}
              onChange={handleChange}
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
          {loading ? "Registrando..." : "Registrarse"}
        </Button>
      </form>

      <div ref={footerRef} className="mt-6 text-center text-sm">
        <span className="text-muted-foreground">¿Ya tienes una cuenta? </span>
        <Link
          href="/auth/login"
          className="font-medium text-primary hover:text-primary/80"
        >
          Inicia sesión aquí
        </Link>
      </div>
    </div>
  );
}
