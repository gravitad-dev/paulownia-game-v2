import { create } from "zustand";
import { AchievementsService } from "@/services/achievements.service";
import { usePlayerStatsStore } from "@/store/usePlayerStatsStore";
import type {
  Achievement,
  AchievementStatus,
  AchievementsFilters,
  AchievementsPagination,
  ClaimedAchievementInfo,
} from "@/types/achievements";

interface AchievementsState {
  // Estado de datos
  achievements: Achievement[];
  pagination: AchievementsPagination | null;

  // Filtros
  currentFilter: AchievementStatus | "all";
  currentPage: number;
  pageSize: number;

  // Estado de UI
  isLoading: boolean;
  isClaiming: boolean;
  error: string | null;

  // Último logro reclamado (para notificaciones)
  lastClaimedAchievement: ClaimedAchievementInfo | null;

  // Contadores
  availableCount: number;

  // Acciones
  fetchAchievements: (filters?: AchievementsFilters) => Promise<void>;
  claimAchievement: (uuid: string) => Promise<boolean>;
  setFilter: (filter: AchievementStatus | "all") => void;
  setPage: (page: number) => void;
  clearLastClaimed: () => void;
  reset: () => void;
}

const initialState = {
  achievements: [],
  pagination: null,
  currentFilter: "all" as const,
  currentPage: 1,
  pageSize: 25,
  isLoading: false,
  isClaiming: false,
  error: null,
  lastClaimedAchievement: null,
  availableCount: 0,
};

export const useAchievementsStore = create<AchievementsState>()((set, get) => ({
  ...initialState,

  fetchAchievements: async (filters?: AchievementsFilters) => {
    const { isLoading, currentFilter, currentPage, pageSize } = get();
    if (isLoading) return;

    set({ isLoading: true, error: null });

    try {
      const effectiveFilters: AchievementsFilters = {
        page: filters?.page ?? currentPage,
        pageSize: filters?.pageSize ?? pageSize,
        ...(filters?.status
          ? { status: filters.status }
          : currentFilter !== "all"
          ? { status: currentFilter }
          : {}),
      };

      const response = await AchievementsService.getMyAchievements(
        effectiveFilters,
      );

      // Contar logros disponibles para reclamar
      const availableCount = response.achievements.filter(
        (a) => a.status === "completed",
      ).length;

      // Actualizar playerStats en el store global
      usePlayerStatsStore.getState().setStats(response.playerStats);

      set({
        achievements: response.achievements,
        pagination: response.meta.pagination,
        currentPage: response.meta.pagination.page,
        isLoading: false,
        availableCount,
      });
    } catch (error) {
      console.error("Error fetching achievements:", error);
      set({
        isLoading: false,
        error: "Error al cargar los logros",
      });
    }
  },

  claimAchievement: async (uuid: string) => {
    const { isClaiming, achievements } = get();
    if (isClaiming) return false;

    // Verificar que el logro existe y está disponible
    const achievement = achievements.find((a) => a.uuid === uuid);
    if (!achievement || achievement.status !== "completed") {
      set({ error: "Este logro no está disponible para reclamar" });
      return false;
    }

    set({ isClaiming: true, error: null });

    try {
      const response = await AchievementsService.claimAchievement(uuid);

      // Actualizar el logro en la lista con estado "claimed"
      const updatedAchievements = achievements.map((a) =>
        a.uuid === uuid
          ? {
              ...a,
              status: "claimed" as const,
              claimedAt: response.claimedAchievement.claimedAt,
            }
          : a,
      );

      // Recalcular contadores
      const availableCount = updatedAchievements.filter(
        (a) => a?.status === "completed",
      ).length;

      // Actualizar playerStats en el store global
      usePlayerStatsStore.getState().setStats(response.playerStats);

      set({
        achievements: updatedAchievements,
        isClaiming: false,
        lastClaimedAchievement: response.claimedAchievement,
        availableCount,
      });

      return true;
    } catch (error: unknown) {
      console.error("Error claiming achievement:", error);

      let errorMessage = "Error al reclamar el logro";
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

  setFilter: (filter: AchievementStatus | "all") => {
    set({ currentFilter: filter, currentPage: 1 });
    get().fetchAchievements({
      page: 1,
      status: filter !== "all" ? filter : undefined,
    });
  },

  setPage: (page: number) => {
    set({ currentPage: page });
    get().fetchAchievements({ page });
  },

  clearLastClaimed: () => set({ lastClaimedAchievement: null }),

  reset: () => set(initialState),
}));

/**
 * Hook selector para obtener logros disponibles para reclamar
 */
export const useAvailableAchievements = () => {
  return useAchievementsStore((state) =>
    state.achievements.filter((a) => a.status === "completed"),
  );
};

/**
 * Hook selector para verificar si hay logros disponibles
 */
export const useHasAvailableAchievements = () => {
  return useAchievementsStore((state) => state.availableCount > 0);
};

/**
 * Hook selector para obtener el conteo de logros disponibles
 */
export const useAvailableAchievementsCount = () => {
  return useAchievementsStore((state) => state.availableCount);
};
