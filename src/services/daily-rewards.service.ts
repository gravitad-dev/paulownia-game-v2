import { withBasePath } from "./base.service";
import type {
  DailyRewardsStatusResponse,
  DailyRewardClaimResponse,
} from "@/types/daily-rewards";

const dailyRewardsApi = withBasePath("/api/daily-rewards");

/**
 * Servicio para gestionar las recompensas diarias
 */
export const DailyRewardsService = {
  /**
   * Obtiene el estado actual de las recompensas diarias del usuario.
   * Incluye la lista de recompensas, si puede reclamar, y estadísticas del jugador.
   */
  async getStatus(): Promise<DailyRewardsStatusResponse> {
    const response = await dailyRewardsApi.get<DailyRewardsStatusResponse>(
      "/my-status",
    );
    return response.data;
  },

  /**
   * Reclama la recompensa del día actual.
   * Solo funciona si canClaim es true.
   * Devuelve la recompensa reclamada y las estadísticas actualizadas.
   */
  async claim(): Promise<DailyRewardClaimResponse> {
    const response = await dailyRewardsApi.post<DailyRewardClaimResponse>(
      "/claim",
    );
    return response.data;
  },
};
