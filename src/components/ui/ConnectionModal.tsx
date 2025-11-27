"use client";

import { useEffect, useRef } from "react";
import { useConnectionStore } from "@/store/useConnectionStore";
import { WifiOff, RefreshCw, ServerCrash } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337";

export function ConnectionModal() {
  const {
    isConnected,
    isChecking,
    lastError,
    retryCount,
    setConnected,
    setChecking,
    incrementRetry,
  } = useConnectionStore();
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Intentar reconectar usando fetch nativo para evitar dependencias circulares
  const handleRetry = async () => {
    if (isChecking) return;

    setChecking(true);
    incrementRetry();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Hacemos fetch a la raíz del servidor
      // Si responde CUALQUIER cosa (200, 404, 500, etc.), el servidor está vivo
      await fetch(`${API_URL}`, {
        method: "HEAD",
        mode: "no-cors", // Evita problemas de CORS, solo queremos saber si responde
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Si llegamos aquí sin error, el servidor está disponible
      setConnected();
      window.location.reload();
    } catch {
      // Error de red real (servidor no disponible, timeout, etc.)
      setChecking(false);
    }
  };

  // Auto-retry cada 10 segundos (máximo 5 intentos automáticos)
  useEffect(() => {
    if (!isConnected && !isChecking && retryCount < 5) {
      retryTimeoutRef.current = setTimeout(() => {
        handleRetry();
      }, 10000);
    }

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [isConnected, isChecking, retryCount]);

  if (isConnected) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-gray-600 bg-gray-800 p-8 shadow-xl">
        {/* Icono */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-gray-700 p-4">
            <ServerCrash className="h-12 w-12 text-gray-300" />
          </div>
        </div>

        {/* Título */}
        <h2 className="mb-2 text-center text-2xl font-bold text-white">
          Sin conexión al servidor
        </h2>

        {/* Mensaje */}
        <p className="mb-6 text-center text-gray-300">
          {lastError || "No se pudo establecer conexión con el servidor."}
        </p>

        {/* Estado de reconexión */}
        {retryCount > 0 && retryCount < 5 && !isChecking && (
          <p className="mb-4 text-center text-sm text-gray-400">
            Reintentando automáticamente... (intento {retryCount}/5)
          </p>
        )}

        {retryCount >= 5 && (
          <div className="mb-4 flex items-center justify-center gap-2 text-amber-400">
            <WifiOff className="h-4 w-4" />
            <span className="text-sm">Reconexión automática pausada</span>
          </div>
        )}

        {/* Botón de reintentar */}
        <button
          onClick={handleRetry}
          disabled={isChecking}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-gray-700 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isChecking ? (
            <>
              <RefreshCw className="h-5 w-5 animate-spin" />
              Conectando...
            </>
          ) : (
            <>
              <RefreshCw className="h-5 w-5" />
              Reintentar conexión
            </>
          )}
        </button>
      </div>
    </div>
  );
}
