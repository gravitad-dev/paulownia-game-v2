import { api } from "@/lib/api";
import type {
  SpinResponse,
  RouletteHistoryItem,
  CatalogResponse,
} from "@/types/reward";
import type { CatalogFilterType } from "@/store/useCatalogStore";

export interface GetCatalogParams {
  page?: number;
  pageSize?: number;
  typeReward?: CatalogFilterType;
  sort?: string;
}

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

  /**
   * Obtiene el catálogo de premios disponibles
   * coins y tickets se filtran en frontend ya que el backend solo tiene "currency"
   */
  getCatalog: async (
    params: GetCatalogParams = {},
  ): Promise<CatalogResponse> => {
    const {
      page = 1,
      pageSize = 12,
      typeReward = "all",
      sort = "name:asc",
    } = params;

    // Construir query string manualmente para Strapi
    const queryParts: string[] = [
      "populate=image",
      `pagination[page]=${page}`,
      `pagination[pageSize]=${pageSize}`,
      `sort=${sort}`,
    ];

    // Mapear filtro a tipo de backend
    // coins y tickets son currency en el backend, se filtran después
    const backendType =
      typeReward === "coins" || typeReward === "tickets"
        ? "currency"
        : typeReward;

    // Filtrar por tipo si no es "all"
    if (backendType && backendType !== "all") {
      queryParts.push(`filters[typeReward][$eq]=${backendType}`);
    }

    const response = await api.get<CatalogResponse>(
      `/api/rewards?${queryParts.join("&")}`,
    );

    return response.data;
  },
};
