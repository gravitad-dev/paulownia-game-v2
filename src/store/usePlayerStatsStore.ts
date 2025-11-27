import { create } from "zustand";
import type { PlayerStats } from "@/types/player-stats";

interface PlayerStatsState {
  // Estado de datos
  stats: PlayerStats | null;
  isLoading: boolean;

  // Acciones
  setStats: (stats: PlayerStats) => void;
  updateCoins: (coins: number) => void;
  updateTickets: (tickets: number) => void;
  reset: () => void;
}

const initialState = {
  stats: null,
  isLoading: false,
};

/**
 * Store global para las estadísticas del jugador (monedas y tickets)
 * Este store es actualizado por otros stores (dailyRewards, achievements)
 * cuando se reclaman recompensas
 */
export const usePlayerStatsStore = create<PlayerStatsState>()((set) => ({
  ...initialState,

  setStats: (stats: PlayerStats) => {
    set({ stats, isLoading: false });
  },

  updateCoins: (coins: number) => {
    set((state) => ({
      stats: state.stats ? { ...state.stats, coins } : { coins, tickets: 0 },
    }));
  },

  updateTickets: (tickets: number) => {
    set((state) => ({
      stats: state.stats ? { ...state.stats, tickets } : { coins: 0, tickets },
    }));
  },

  reset: () => set(initialState),
}));

/**
 * Hook selector para obtener solo las monedas
 */
export const usePlayerCoins = () => {
  return usePlayerStatsStore((state) => state.stats?.coins ?? 0);
};

/**
 * Hook selector para obtener solo los tickets
 */
export const usePlayerTickets = () => {
  return usePlayerStatsStore((state) => state.stats?.tickets ?? 0);
};
