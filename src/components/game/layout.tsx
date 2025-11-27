"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { useDailyRewardsStore } from "@/store/useDailyRewardsStore";
import { RetroBackground } from "@/components/ui/RetroBackground";
import { Header } from "@/components/layout/Header";
import { DailyRewardsModal } from "@/components/game/rewards";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, user } = useAuthStore();
  const { fetchStatus } = useDailyRewardsStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, mounted, router]);

  // Cargar el estado de daily rewards al iniciar (forzando apertura en login)
  useEffect(() => {
    if (mounted && isAuthenticated && user?.id) {
      fetchStatus(user.id, { openReason: "login" });
    }
  }, [mounted, isAuthenticated, user?.id, fetchStatus]);

  if (!mounted) {
    return null;
  }

  if (!isAuthenticated) {
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

      {/* Modal de Daily Rewards - se abre automáticamente si hay recompensa */}
      <DailyRewardsModal />
    </div>
  );
}
