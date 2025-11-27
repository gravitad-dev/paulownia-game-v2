/**
 * Tipos para el sistema de Recompensas Diarias (Daily Rewards)
 */

/** Tipo de recompensa */
export type RewardType = "coins" | "tickets";

/** Estado de una recompensa individual */
export type RewardStatus = "locked" | "available" | "claimed";

/** Imagen de Strapi (opcional) */
export interface RewardImage {
  id: number;
  url: string;
  width?: number;
  height?: number;
}

/** Estructura de una recompensa diaria individual */
export interface DailyReward {
  id: number;
  documentId: string;
  uuid: string;
  name: string;
  day: number;
  rewardType: RewardType;
  rewardAmount: number;
  isActive: boolean;
  image: RewardImage | null;
  status: RewardStatus;
  claimedAt: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  locale: string | null;
}

/** Estadísticas del jugador (monedas y tickets) */
export interface PlayerStats {
  coins: number;
  tickets: number;
}

/** Respuesta del endpoint GET /api/daily-rewards/my-status */
export interface DailyRewardsStatusResponse {
  nextDay: number;
  canClaim: boolean;
  lastClaimedDate: string | null;
  nextClaimDate: string | null;
  rewards: DailyReward[];
  playerStats: PlayerStats;
}

/** Recompensa reclamada en la respuesta de claim */
export interface ClaimedRewardInfo {
  day: number;
  type: RewardType;
  amount: number;
  name: string;
  image: RewardImage | null;
  claimedAt: string;
}

/** Estado después de reclamar */
export interface ClaimStatusInfo {
  nextDay: number;
  canClaim: boolean;
  nextClaimDate: string | null;
}

/** Respuesta del endpoint POST /api/daily-rewards/claim */
export interface DailyRewardClaimResponse {
  claimedReward: ClaimedRewardInfo;
  rewards: DailyReward[];
  playerStats: PlayerStats;
  status: ClaimStatusInfo;
}

/** Error de claim (cuando ya se reclamó hoy) */
export interface DailyRewardClaimError {
  data: null;
  error: {
    status: number;
    name: string;
    message: string;
    details: {
      reason: "already_claimed_today" | string;
      nextClaimDate: string;
    };
  };
}
