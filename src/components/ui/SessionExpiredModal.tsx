"use client";

import { useConnectionStore } from "@/store/useConnectionStore";
import { useAuthStore } from "@/store/useAuthStore";
import { LogOut } from "lucide-react";

export function SessionExpiredModal() {
  const { sessionExpired, reset } = useConnectionStore();
  const logout = useAuthStore((state) => state.logout);

  const handleGoToLogin = () => {
    // Primero hacer logout para limpiar el estado
    logout();
    // Resetear el estado de conexión
    reset();
    // Redirigir al login
    window.location.href = "/auth/login";
  };

  if (!sessionExpired) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-gray-600 bg-gray-800 p-8 shadow-xl">
        {/* Icono */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-gray-700 p-4">
            <LogOut className="h-12 w-12 text-gray-300" />
          </div>
        </div>

        {/* Título */}
        <h2 className="mb-2 text-center text-2xl font-bold text-white">
          Sesión expirada
        </h2>

        {/* Mensaje */}
        <p className="mb-6 text-center text-gray-300">
          Tu sesión ha expirado. Por favor, inicia sesión nuevamente para
          continuar.
        </p>

        {/* Botón */}
        <button
          onClick={handleGoToLogin}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-gray-700 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-600"
        >
          Ir al inicio de sesión
        </button>
      </div>
    </div>
  );
}
