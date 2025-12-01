"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useDailyRewardsStore } from "@/store/useDailyRewardsStore";
import { useAchievementsStore } from "@/store/useAchievementsStore";
import { RetroBackground } from "@/components/ui/RetroBackground";
import { Header } from "@/components/layout/Header";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, user, token } = useAuthStore();
  const { fetchStatus } = useDailyRewardsStore();
  const { fetchAchievements } = useAchievementsStore();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  // Esperar al montaje y dar tiempo a Zustand para hidratarse
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    // Check both isAuthenticated flag and actual token/user presence
    const hasValidSession = isAuthenticated && token && user;

    if (!hasValidSession) {
      router.replace("/auth/login");
    }
  }, [isAuthenticated, token, user, isReady, router]);

  useEffect(() => {
    if (isReady && isAuthenticated && user?.id) {
      fetchStatus();
      fetchAchievements();
    }
  }, [isReady, isAuthenticated, user?.id, fetchStatus, fetchAchievements]);

  // Mostrar loading mientras se prepara
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary">Cargando...</div>
      </div>
    );
  }

  // Double check before rendering
  if (!isAuthenticated || !token || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-transparent text-foreground selection:bg-primary/30 relative">
      <RetroBackground />
      <Header />
      <main
        className="pt-32 px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8 mx-auto min-h-screen flex flex-col"
        style={{
          maxWidth: "1200px",
          width: "100%",
        }}
      >
        {children}
      </main>
    </div>
  );
}
