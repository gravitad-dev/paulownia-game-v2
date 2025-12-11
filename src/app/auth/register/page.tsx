"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
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
  const [success, setSuccess] = useState(false);
  const toast = useToast();

  const formRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const fieldsRef = useRef<HTMLDivElement[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);

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
        },
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
          },
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
            },
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
          },
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
          },
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
    if (loading) return;
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

    const passwordPolicy = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordPolicy.test(formData.password)) {
      toast.error(
        "Contraseña inválida",
        "Debe tener 8+ caracteres, una mayúscula y un número",
      );
      setLoading(false);
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

    if (formData.password !== formData.confirmPassword) {
      toast.error(
        "Las contraseñas no coinciden.",
        "Por favor, vuelve a intentarlo.",
      );
      setLoading(false);
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

    const usernameRegex = /^[A-Za-z0-9]+$/;
    if (!usernameRegex.test(formData.username)) {
      toast.error("Usuario inválido", "Sólo se permiten letras y números");
      setLoading(false);
      if (usernameInputRef.current) {
        usernameInputRef.current.focus();
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Email inválido", "Verifica que esté bien escrito");
      setLoading(false);
      if (emailInputRef.current) {
        emailInputRef.current.focus();
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

    try {
      await api.post("/api/auth/local/register", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });
      setSuccess(true);
      toast.success(
        "Registro exitoso",
        "Te enviamos un correo para confirmar tu cuenta. Revisa tu bandeja y spam.",
      );
    } catch (err: unknown) {
      const errorMessage =
        (
          err as {
            response?: { data?: { error?: { message?: string } } };
          }
        )?.response?.data?.error?.message ||
        (err as { message?: string })?.message ||
        "Error al registrarse. Inténtalo de nuevo.";

      if (errorMessage === "Email or Username are already taken") {
        toast.error(
          "Usuario o correo electrónico ya registrado.",
          "Por favor, utilice otro.",
        );
      } else toast.error(errorMessage);

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

  if (success) {
    return (
      <div className="bg-card p-8 rounded-lg shadow-lg border border-border w-full max-w-md mx-auto text-center animate-in fade-in zoom-in duration-500">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-12 h-12 text-primary"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>
        </div>
        <h3 className="text-2xl font-semibold mb-4 text-card-foreground">
          ¡Revisa tu correo!
        </h3>
        <p className="text-muted-foreground mb-8">
          Te hemos enviado un enlace de confirmación a{" "}
          <span className="font-medium text-foreground">{formData.email}</span>.
          <br />
          Por favor, confirma tu cuenta antes de iniciar sesión.
        </p>
        <Link href="/auth/login">
          <Button variant="outline" className="w-full">
            Ir a Iniciar Sesión
          </Button>
        </Link>
      </div>
    );
  }

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
            autoComplete="username"
            ref={usernameInputRef}
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
            autoComplete="email"
            ref={emailInputRef}
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
              minLength={8}
              autoComplete="new-password"
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
              minLength={8}
              autoComplete="new-password"
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
