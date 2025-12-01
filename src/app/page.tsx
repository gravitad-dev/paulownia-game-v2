"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  // Esperar al montaje del componente (indica que el cliente está listo)
  useEffect(() => {
    // Pequeño delay para asegurar que Zustand se hidrate
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    if (isAuthenticated) {
      router.replace("/game");
    } else {
      router.replace("/auth/login");
    }
  }, [isAuthenticated, router, isReady]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse text-primary">Cargando...</div>
    </div>
  );
}
