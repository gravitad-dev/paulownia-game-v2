/**
 * Achievement Types
 */

export type AchievementStatus = "locked" | "completed" | "claimed";

export type TargetType = "gamesWon" | "dailyLogin" | "xp" | "score" | "time";

export type RewardType = "coins" | "tickets";

export interface Achievement {
  id: number;
  documentId: string;
  uuid: string;
  title: string;
  description: string;
  quantity: string;
  goalAmount: number;
  targetType: TargetType;
  rewardAmount: number;
  visibleToUser: boolean;
  isActive: boolean;
  rewardType: RewardType;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  locale: string | null;
  image: string | null;
  status: AchievementStatus;
  currentProgress: number;
  obtainedAt: string | null;
  claimedAt: string | null;
}

export interface PlayerStats {
  coins: number;
  tickets: number;
}

export interface AchievementsPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface AchievementsResponse {
  achievements: Achievement[];
  playerStats: PlayerStats;
  meta: {
    pagination: AchievementsPagination;
  };
}

export interface ClaimAchievementRequest {
  uuid: string;
}

/**
 * Info del logro reclamado que devuelve el endpoint de claim
 */
export interface ClaimedAchievementInfo {
  uuid: string;
  title: string;
  rewardType: RewardType;
  rewardAmount: number;
  image: string | null;
  claimedAt: string;
}

export interface ClaimAchievementResponse {
  claimedAchievement: ClaimedAchievementInfo;
  playerStats: PlayerStats;
}

export interface AchievementErrorDetails {
  currentProgress?: number;
  goalAmount?: number;
  claimedAt?: string;
}

export interface AchievementError {
  error: {
    status: number;
    message: string;
    details?: AchievementErrorDetails;
  };
}

export interface AchievementsFilters {
  page?: number;
  pageSize?: number;
  status?: AchievementStatus;
}
