/**
 * Tipos del sistema de Ruleta de Premios
 */

export type RewardType = "currency" | "consumable" | "cosmetic";
export type RewardStatus = "pending" | "claimed" | "available";

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
