"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { RetroBackground } from "@/components/ui/RetroBackground";
import { Header } from "@/components/layout/Header";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, token, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Check both isAuthenticated flag and actual token/user presence
      const hasValidSession = isAuthenticated && token && user;
      
      if (!hasValidSession) {
        // Use window.location for forced redirect that works even with navigation errors
        window.location.href = "/auth/login";
      }
    }
  }, [isAuthenticated, token, user, mounted]);

  if (!mounted) {
    return null;
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
