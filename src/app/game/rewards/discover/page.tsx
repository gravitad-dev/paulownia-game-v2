"use client";

import { Sparkles, Ticket } from "lucide-react";
import { usePlayerStatsStore } from "@/store/usePlayerStatsStore";

export default function DiscoverRewardsPage() {
  const playerStats = usePlayerStatsStore((state) => state.stats);
  const hasTickets = playerStats?.tickets && playerStats.tickets > 0;

  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <div className="text-center max-w-md">
        <div className="relative inline-block mb-6">
          <div className="p-6 bg-linear-to-br from-primary/20 to-primary/5 rounded-full">
            <Sparkles className="h-16 w-16 text-primary" />
          </div>
          {hasTickets && (
            <div className="absolute -top-2 -right-2 flex items-center gap-1 bg-amber-500 text-white px-2 py-1 rounded-full text-sm font-semibold shadow-lg">
              <Ticket className="h-4 w-4" />
              {playerStats.tickets}
            </div>
          )}
        </div>

        <h2 className="text-xl font-semibold mb-2">Ruleta de Premios</h2>
        <p className="text-muted-foreground mb-6">
          Usa tus tickets para descubrir premios increíbles. ¡Cada ticket es una
          oportunidad de ganar!
        </p>

        <div className="p-4 bg-muted/50 rounded-lg border border-dashed border-border">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Próximamente:</span>{" "}
            La ruleta de premios estará disponible muy pronto. Mientras tanto,
            ¡acumula tickets canjeando tus monedas!
          </p>
        </div>
      </div>
    </div>
  );
}
