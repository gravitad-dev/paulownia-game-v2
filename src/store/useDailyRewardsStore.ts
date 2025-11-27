import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DailyRewardsService } from "@/services/daily-rewards.service";
import type {
  DailyReward,
  DailyRewardsStatusResponse,
  PlayerStats,
  ClaimedRewardInfo,
} from "@/types/daily-rewards";

interface DailyRewardsState {
  // Estado de datos
  rewards: DailyReward[];
  playerStats: PlayerStats | null;
  canClaim: boolean;
  nextDay: number;
  nextClaimDate: string | null;
  lastClaimedDate: string | null;

  // Estado de UI
  isLoading: boolean;
  isClaiming: boolean;
  error: string | null;

  // Control del modal - ahora incluye el userId para diferenciar usuarios
  isModalOpen: boolean;
  modalDismissedData: { date: string; userId: number } | null;

  // Último claim exitoso (para toast notification)
  lastClaimedReward: ClaimedRewardInfo | null;

  // Acciones
  fetchStatus: (
    userId?: number,
    options?: {
      preserveModalState?: boolean;
      openReason?: "login" | "navigation";
    },
  ) => Promise<void>;
  claimReward: () => Promise<boolean>;
  openModal: () => void;
  closeModal: () => void;
  dismissModalForToday: (userId: number) => void;
  reset: () => void;
}

const initialState = {
  rewards: [],
  playerStats: null,
  canClaim: false,
  nextDay: 1,
  nextClaimDate: null,
  lastClaimedDate: null,
  isLoading: false,
  isClaiming: false,
  error: null,
  isModalOpen: false,
  modalDismissedData: null,
  lastClaimedReward: null,
};

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD (sin hora)
 */
const getTodayString = (): string => {
  return new Date().toISOString().split("T")[0];
};

/**
 * Verifica si el modal fue dismisseado hoy por este usuario
 */
const wasModalDismissedToday = (
  dismissedData: { date: string; userId: number } | null,
  currentUserId?: number,
): boolean => {
  if (!dismissedData || !currentUserId) return false;
  return (
    dismissedData.date === getTodayString() &&
    dismissedData.userId === currentUserId
  );
};

export const useDailyRewardsStore = create<DailyRewardsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchStatus: async (
        userId?: number,
        options?: {
          preserveModalState?: boolean;
          openReason?: "login" | "navigation";
        },
      ) => {
        const { isLoading, isModalOpen } = get();
        if (isLoading) return;

        set({ isLoading: true, error: null });

        try {
          const status: DailyRewardsStatusResponse =
            await DailyRewardsService.getStatus();

          const { modalDismissedData } = get();
          const preserveModalState = options?.preserveModalState === true;
          const openReason = options?.openReason;

          // Determinar si se debe abrir el modal
          let shouldShowModal: boolean;
          if (preserveModalState) {
            // Mantener el estado actual del modal (evita parpadeos)
            shouldShowModal = isModalOpen;
          } else if (openReason === "login") {
            // En login: si puede reclamar, abrir siempre (ignora dismiss de hoy)
            shouldShowModal = status.canClaim;
          } else {
            // Navegación normal: NUNCA abrir automáticamente
            // El modal solo se abre en login o manualmente
            shouldShowModal = false;
          }

          set({
            rewards: status.rewards,
            playerStats: status.playerStats,
            canClaim: status.canClaim,
            nextDay: status.nextDay,
            nextClaimDate: status.nextClaimDate,
            lastClaimedDate: status.lastClaimedDate,
            isLoading: false,
            // Abrir modal automáticamente si puede reclamar y no lo dismisseó hoy
            isModalOpen: shouldShowModal,
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

          set({
            rewards: response.rewards,
            playerStats: response.playerStats,
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

      openModal: () => set({ isModalOpen: true }),

      closeModal: () => set({ isModalOpen: false }),

      dismissModalForToday: (userId: number) => {
        set({
          isModalOpen: false,
          modalDismissedData: { date: getTodayString(), userId },
        });
      },

      reset: () => set(initialState),
    }),
    {
      name: "daily-rewards-storage",
      // Solo persistir el campo de dismiss del modal (con userId)
      partialize: (state) => ({
        modalDismissedData: state.modalDismissedData,
      }),
    },
  ),
);

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
