import { create } from "zustand";
import { ExchangeService } from "@/services/exchange.service";
import { usePlayerStatsStore } from "@/store/usePlayerStatsStore";
import type {
  ExchangeLimit,
  ExchangeHistoryItem,
  ExchangeStatusResponse,
} from "@/types/exchange";

interface ExchangeState {
  // Estado del canje
  canExchange: boolean;
  maxTicketsPossible: number;
  rate: number;
  limit: ExchangeLimit | null;
  history: ExchangeHistoryItem[];

  // Estados de carga
  isLoading: boolean;
  isExchanging: boolean;

  // Último canje exitoso (para feedback)
  lastExchange: {
    ticketsExchanged: number;
    coinsSpent: number;
  } | null;

  // Errores
  error: string | null;

  // Acciones
  fetchStatus: () => Promise<void>;
  exchangeCoins: (ticketsRequested: number) => Promise<boolean>;
  reset: () => void;
}

const initialState = {
  canExchange: false,
  maxTicketsPossible: 0,
  rate: 0,
  limit: null,
  history: [],
  isLoading: false,
  isExchanging: false,
  lastExchange: null,
  error: null,
};

export const useExchangeStore = create<ExchangeState>()((set, get) => ({
  ...initialState,

  fetchStatus: async () => {
    const { isLoading } = get();
    if (isLoading) return;

    set({ isLoading: true, error: null });

    try {
      const status: ExchangeStatusResponse = await ExchangeService.getStatus();

      // Actualizar playerStats en el store global
      usePlayerStatsStore.getState().setStats(status.playerStats);

      set({
        canExchange: status.status.canExchange,
        maxTicketsPossible: status.status.maxTicketsPossible,
        rate: status.rate,
        limit: status.limit || null,
        history: status.history,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching exchange status:", error);
      set({
        isLoading: false,
        error: "Error al cargar el estado del canje",
      });
    }
  },

  exchangeCoins: async (ticketsRequested: number) => {
    const { isExchanging, canExchange, maxTicketsPossible } = get();

    // Validaciones previas
    if (isExchanging) return false;
    if (!canExchange) {
      set({ error: "No puedes realizar canjes en este momento" });
      return false;
    }
    if (ticketsRequested > maxTicketsPossible) {
      set({ error: `Solo puedes canjear hasta ${maxTicketsPossible} tickets` });
      return false;
    }
    if (ticketsRequested <= 0) {
      set({ error: "Debes solicitar al menos 1 ticket" });
      return false;
    }

    set({ isExchanging: true, error: null });

    try {
      const response = await ExchangeService.exchange(ticketsRequested);

      // Actualizar playerStats en el store global
      usePlayerStatsStore.getState().setStats(response.playerStats);

      // Recalcular maxTicketsPossible basado en nuevas monedas y límite
      const newMaxByCoins = Math.floor(response.playerStats.coins / get().rate);
      const newMaxByLimit = response.limit?.ticketsRemaining ?? Infinity;
      const newMaxTicketsPossible = Math.min(newMaxByCoins, newMaxByLimit);

      set({
        limit: response.limit || null,
        history: response.history,
        isExchanging: false,
        lastExchange: {
          ticketsExchanged: response.ticketsExchanged,
          coinsSpent: response.coinsSpent,
        },
        canExchange: newMaxTicketsPossible > 0,
        maxTicketsPossible: newMaxTicketsPossible,
      });

      return true;
    } catch (error: unknown) {
      console.error("Error exchanging coins:", error);

      // Extraer mensaje de error del backend
      let errorMessage = "Error al realizar el canje";

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: {
            data?: {
              error?: {
                message?: string;
                details?: { reason?: string };
              };
            };
          };
        };

        const details = axiosError.response?.data?.error?.details;
        const reason = details?.reason;

        switch (reason) {
          case "insufficient_coins":
            errorMessage = "No tienes suficientes monedas para este canje";
            break;
          case "exchange_limit_reached":
            errorMessage = "Has alcanzado el límite de canjes del período";
            break;
          case "settings_not_configured":
            errorMessage =
              "El sistema de canje no está configurado. Por favor, contacta al administrador";
            break;
          case "unauthorized":
            errorMessage =
              "Sesión expirada. Por favor, inicia sesión nuevamente";
            break;
          default:
            errorMessage =
              axiosError.response?.data?.error?.message || errorMessage;
        }
      }

      set({
        isExchanging: false,
        error: errorMessage,
      });

      return false;
    }
  },

  reset: () => set(initialState),
}));

/**
 * Hook selector para verificar si se puede canjear
 */
export const useCanExchange = () => {
  return useExchangeStore((state) => state.canExchange);
};

/**
 * Hook selector para obtener la tasa de cambio
 */
export const useExchangeRate = () => {
  return useExchangeStore((state) => state.rate);
};

/**
 * Hook selector para obtener el límite de canje
 */
export const useExchangeLimit = () => {
  return useExchangeStore((state) => state.limit);
};
