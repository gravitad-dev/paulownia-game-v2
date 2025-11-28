import { create } from "zustand";
import { RewardService } from "@/services/reward.service";
import { usePlayerStatsStore } from "@/store/usePlayerStatsStore";
import type { Reward, UserReward, SpinResponse } from "@/types/reward";

type SpinPhase = "idle" | "spinning" | "revealing" | "revealed";

interface RewardState {
  // Estado del spin
  phase: SpinPhase;

  // Premio actual (después del spin)
  currentReward: Reward | null;
  currentUserReward: UserReward | null;

  // PlayerStats pendientes de actualizar (se actualizan al revelar)
  pendingPlayerStats: { coins: number; tickets: number } | null;

  // Errores
  error: string | null;

  // Acciones
  spin: () => Promise<boolean>;
  setPhase: (phase: SpinPhase) => void;
  clearCurrentReward: () => void;
  reset: () => void;
}

const initialState = {
  phase: "idle" as SpinPhase,
  currentReward: null,
  currentUserReward: null,
  pendingPlayerStats: null,
  error: null,
};

export const useRewardStore = create<RewardState>()((set, get) => ({
  ...initialState,

  spin: async () => {
    const { phase } = get();

    // No permitir spin si ya está en proceso
    if (phase !== "idle") return false;

    set({ phase: "spinning", error: null });

    // Descuento optimista: restar 1 ticket inmediatamente para feedback visual
    const playerStatsStore = usePlayerStatsStore.getState();
    const currentStats = playerStatsStore.stats;
    if (currentStats) {
      playerStatsStore.setStats({
        coins: currentStats.coins,
        tickets: currentStats.tickets - 1,
      });
    }

    try {
      const response: SpinResponse = await RewardService.spin();

      // Guardar el premio y los stats pendientes (aún no lo mostramos, esperamos la animación)
      set({
        currentReward: response.reward,
        currentUserReward: response.userReward,
        pendingPlayerStats: response.playerStats,
      });

      return true;
    } catch (error: unknown) {
      console.error("Error spinning reward:", JSON.stringify(error, null, 2));

      let errorMessage = "Error al girar la ruleta";

      // Intentar extraer información del error
      if (error && typeof error === "object") {
        // Error de Axios con response
        if ("response" in error) {
          const axiosError = error as {
            response?: {
              status?: number;
              data?: {
                error?: {
                  message?: string;
                  details?: { reason?: string };
                };
                message?: string;
              };
            };
          };

          const status = axiosError.response?.status;
          const reason = axiosError.response?.data?.error?.details?.reason;
          const backendMessage =
            axiosError.response?.data?.error?.message ||
            axiosError.response?.data?.message;

          // Manejar por reason específico
          switch (reason) {
            case "unauthorized":
              errorMessage =
                "Sesión expirada. Por favor, inicia sesión nuevamente";
              break;
            case "insufficient_tickets":
              errorMessage = "No tienes tickets suficientes para girar";
              break;
            case "no_rewards_available":
              errorMessage = "No hay premios disponibles en este momento";
              break;
            case "all_unique_rewards_obtained":
              errorMessage = "¡Ya has obtenido todos los premios únicos!";
              break;
            case "probability_selection_failed":
              errorMessage = "Error al seleccionar premio. Intenta de nuevo";
              break;
            case "cosmetic_not_implemented":
              errorMessage = "Los premios cosméticos aún no están disponibles";
              break;
            default:
              // Si hay mensaje del backend, usarlo
              if (backendMessage) {
                errorMessage = backendMessage;
              } else if (status === 401) {
                errorMessage =
                  "Sesión expirada. Por favor, inicia sesión nuevamente";
              } else if (status === 400) {
                errorMessage =
                  "No se pudo completar el giro. Verifica tus tickets.";
              } else if (status === 500) {
                errorMessage =
                  "Error del servidor. Intenta de nuevo más tarde.";
              }
          }
        }
        // Error de red (sin response)
        else if ("message" in error) {
          const netError = error as { message: string };
          if (netError.message.includes("Network Error")) {
            errorMessage = "Error de conexión. Verifica tu internet.";
          } else {
            errorMessage = netError.message;
          }
        }
      }

      set({
        phase: "idle",
        error: errorMessage,
      });

      // Restaurar el ticket si hubo error (revertir descuento optimista)
      if (currentStats) {
        playerStatsStore.setStats({
          coins: currentStats.coins,
          tickets: currentStats.tickets,
        });
      }

      return false;
    }
  },

  setPhase: (phase: SpinPhase) => {
    const { pendingPlayerStats } = get();

    // Actualizar playerStats solo cuando se revela el premio
    if (phase === "revealed" && pendingPlayerStats) {
      usePlayerStatsStore.getState().setStats(pendingPlayerStats);
    }

    set({ phase });
  },

  clearCurrentReward: () => {
    set({
      phase: "idle",
      currentReward: null,
      currentUserReward: null,
      pendingPlayerStats: null,
    });
  },

  reset: () => set(initialState),
}));

/**
 * Hook selector para verificar si puede girar
 */
export const useCanSpin = () => {
  const phase = useRewardStore((state) => state.phase);
  const tickets = usePlayerStatsStore((state) => state.stats?.tickets ?? 0);
  return phase === "idle" && tickets > 0;
};
