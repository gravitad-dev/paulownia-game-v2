import { create } from "zustand";
import { DailyRewardsService } from "@/services/daily-rewards.service";
import { usePlayerStatsStore } from "@/store/usePlayerStatsStore";
import type {
  DailyReward,
  DailyRewardsStatusResponse,
  ClaimedRewardInfo,
} from "@/types/daily-rewards";

interface DailyRewardsState {
  // Estado de datos
  rewards: DailyReward[];
  canClaim: boolean;
  nextDay: number;
  nextClaimDate: string | null;
  lastClaimedDate: string | null;

  // Estado de UI
  isLoading: boolean;
  isClaiming: boolean;
  error: string | null;

  // Último claim exitoso (para toast notification)
  lastClaimedReward: ClaimedRewardInfo | null;

  // Acciones
  fetchStatus: () => Promise<void>;
  claimReward: () => Promise<boolean>;
  reset: () => void;
}

const initialState = {
  rewards: [],
  canClaim: false,
  nextDay: 1,
  nextClaimDate: null,
  lastClaimedDate: null,
  isLoading: false,
  isClaiming: false,
  error: null,
  lastClaimedReward: null,
};

export const useDailyRewardsStore = create<DailyRewardsState>()((set, get) => ({
  ...initialState,

  fetchStatus: async () => {
    const { isLoading } = get();
    if (isLoading) return;

    set({ isLoading: true, error: null });

    try {
      const status: DailyRewardsStatusResponse =
        await DailyRewardsService.getStatus();

      // Actualizar playerStats en el store global
      usePlayerStatsStore.getState().setStats(status.playerStats);

      set({
        rewards: status.rewards,
        canClaim: status.canClaim,
        nextDay: status.nextDay,
        nextClaimDate: status.nextClaimDate,
        lastClaimedDate: status.lastClaimedDate,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching daily rewards status:", error);
      set({
        isLoading: false,
        error: "Error al cargar las recompensas diarias",
      });
    }
  },

  claimReward: async () => {
    const { isClaiming, canClaim } = get();
    if (isClaiming || !canClaim) return false;

    set({ isClaiming: true, error: null });

    try {
      const response = await DailyRewardsService.claim();

      // Actualizar playerStats en el store global
      usePlayerStatsStore.getState().setStats(response.playerStats);

      set({
        rewards: response.rewards,
        canClaim: response.status.canClaim,
        nextDay: response.status.nextDay,
        nextClaimDate: response.status.nextClaimDate,
        isClaiming: false,
        lastClaimedReward: response.claimedReward,
      });

      return true;
    } catch (error: unknown) {
      console.error("Error claiming daily reward:", error);

      // Extraer mensaje de error del backend
      let errorMessage = "Error al reclamar la recompensa";
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { data?: { error?: { message?: string } } };
        };
        errorMessage =
          axiosError.response?.data?.error?.message || errorMessage;
      }

      set({
        isClaiming: false,
        error: errorMessage,
      });

      return false;
    }
  },

  reset: () => set(initialState),
}));

/**
 * Hook selector para obtener la recompensa disponible actual
 */
export const useAvailableReward = () => {
  return useDailyRewardsStore((state) =>
    state.rewards.find((r) => r.status === "available"),
  );
};

/**
 * Hook selector para verificar si hay recompensa reclamable
 */
export const useCanClaimReward = () => {
  return useDailyRewardsStore((state) => state.canClaim);
};
