/**
 * Tipos del sistema de Ruleta de Premios
 */

export type RewardType = "currency" | "consumable" | "cosmetic";
export type RewardStatus =
  | "notAvailable"
  | "available"
  | "claimed"
  | "expired"
  | "blocked"
  | "pending"
  | "in_claim";

export interface RewardImage {
  id: number;
  url: string;
  name: string;
}

export interface Reward {
  uuid: string;
  name: string;
  description: string;
  image: RewardImage | null;
  typeReward: RewardType;
  value: number;
  quantity: number;
}

export interface UserReward {
  uuid: string;
  rewardStatus: RewardStatus;
  claimed: boolean;
  obtainedAt: string;
  claimedAt: string | null;
  quantity: number;
  canBeClaimed?: boolean;
  hasClaim?: boolean;
  claimDeadline?: string;
}

export interface SpinResponse {
  reward: Reward;
  userReward: UserReward;
  playerStats: {
    coins: number;
    tickets: number;
  };
}

export interface SpinError {
  status: number;
  message: string;
  data?: {
    reason: string;
  };
}

export interface RouletteHistoryItem {
  id: number;
  uuid: string;
  timestamp: string;
  reward: Reward | null;
  createdAt: string;
}

/**
 * Premio del catálogo (desde Strapi)
 */
export interface CatalogReward {
  id: number;
  documentId: string;
  uuid: string;
  name: string;
  description: string;
  typeReward: RewardType;
  quantity: number;
  value: number;
  probability: number;
  image: RewardImage | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

/**
 * Premio obtenido por el usuario (desde /api/user-rewards)
 */
export interface UserRewardDetailed {
  id: number;
  documentId: string;
  uuid: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  rewardStatus: RewardStatus;
  claimed: boolean;
  obtainedAt: string;
  claimedAt: string | null;
  expiresAt: string | null;
  quantity: number;
  canBeClaimed?: boolean;
  hasClaim?: boolean;
  claimDeadline?: string;
  reward: {
    id: number;
    uuid: string;
    name: string;
    description: string;
    typeReward: RewardType;
    value: number;
    quantity: number;
    probability: number;
    isActive: boolean;
    isUnique: boolean;
    image: RewardImage | null;
  };
}

/**
 * Respuesta paginada de Strapi
 */
export interface StrapiPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface CatalogResponse {
  data: CatalogReward[];
  meta: {
    pagination: StrapiPagination;
  };
}

export interface UserRewardsResponse {
  data: UserRewardDetailed[];
  meta: {
    pagination: StrapiPagination;
  };
}

export interface UserRewardsFilters {
  page?: number;
  pageSize?: number;
  rewardStatus?: RewardStatus | "all";
  claimed?: boolean;
}
