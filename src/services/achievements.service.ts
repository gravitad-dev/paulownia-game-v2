import { withBasePath } from "./base.service";
import type {
  AchievementsResponse,
  ClaimAchievementRequest,
  ClaimAchievementResponse,
  AchievementsFilters,
} from "@/types/achievements";

const achievementsApi = withBasePath("/api/achievements");

export const AchievementsService = {
  /**
   * Obtiene la lista de logros del usuario con su progreso actual
   * @param filters Filtros opcionales (page, pageSize, status)
   * @returns Lista de logros con stats del jugador y paginación
   */
  async getMyAchievements(
    filters?: AchievementsFilters,
  ): Promise<AchievementsResponse> {
    const params = new URLSearchParams();

    if (filters?.page) {
      params.append("page", filters.page.toString());
    }
    if (filters?.pageSize) {
      params.append("pageSize", filters.pageSize.toString());
    }
    if (filters?.status) {
      params.append("status", filters.status);
    }

    const queryString = params.toString();
    const url = queryString
      ? `/my-achievements?${queryString}`
      : "/my-achievements";

    const response = await achievementsApi.get<AchievementsResponse>(url);
    return response.data;
  },

  /**
   * Reclama la recompensa de un logro completado
   * @param uuid UUID del logro a reclamar
   * @returns Datos del logro reclamado y stats actualizados del jugador
   */
  async claimAchievement(uuid: string): Promise<ClaimAchievementResponse> {
    const data: ClaimAchievementRequest = { uuid };
    const response = await achievementsApi.post<ClaimAchievementResponse>(
      "/claim",
      data,
    );
    return response.data;
  },
};
