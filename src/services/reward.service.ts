import { api } from "@/lib/api";
import type { SpinResponse, RouletteHistoryItem } from "@/types/reward";

/**
 * Servicio para la Ruleta de Premios
 */
export const RewardService = {
  /**
   * Gira la ruleta usando 1 ticket
   * El backend devuelve el premio inmediatamente,
   * el frontend controla la animación
   */
  spin: async (): Promise<SpinResponse> => {
    const response = await api.post<SpinResponse>("/api/rewards/spin", {});
    return response.data;
  },

  /**
   * Obtiene el historial de giros de ruleta del usuario
   * @param limit Cantidad de registros a obtener (por defecto 100)
   */
  getHistory: async (limit: number = 100): Promise<RouletteHistoryItem[]> => {
    try {
      const response = await api.get<{ data: RouletteHistoryItem[] }>(
        "/api/roulette-histories",
        {
          params: {
            populate: "*",
            "pagination[pageSize]": limit,
            sort: "timestamp:desc",
            publicationState: "live",
          },
        },
      );
      // Filtrar solo los que tienen premio (reward no null)
      return response.data.data.filter((item) => item.reward !== null);
    } catch (error) {
      console.warn("Historial de premios no disponible:", error);
      // Si el endpoint no existe o falla, retornar array vacío
      return [];
    }
  },
};
