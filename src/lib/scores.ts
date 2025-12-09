import { UserGameHistory } from "@/types/user";

export interface ScoresSummaryStats {
  gamesCount: number;
  averageScore: number;
  completedPercentage: number;
  totalCoins: number;
}

export const DEFAULT_SUMMARY_LIMIT = 100;

/**
 * Calcula estadísticas agregadas sobre las últimas N partidas.
 * El array se asume ordenado de más reciente a más antigua por completedAt.
 */
export function calculateScoresSummary(
  histories: UserGameHistory[],
  limit: number = DEFAULT_SUMMARY_LIMIT
): ScoresSummaryStats {
  if (!histories || histories.length === 0) {
    return {
      gamesCount: 0,
      averageScore: 0,
      completedPercentage: 0,
      totalCoins: 0,
    };
  }

  const slice = histories.slice(0, Math.max(0, limit));

  const gamesCount = slice.length;

  if (gamesCount === 0) {
    return {
      gamesCount: 0,
      averageScore: 0,
      completedPercentage: 0,
      totalCoins: 0,
    };
  }

  let totalScore = 0;
  let completedCount = 0;
  let totalCoins = 0;

  for (const game of slice) {
    totalScore += game.score || 0;
    totalCoins += game.coinsEarned || 0;
    if (game.completed) {
      completedCount += 1;
    }
  }

  const averageScore = totalScore / gamesCount;
  const completedPercentage = (completedCount / gamesCount) * 100;

  return {
    gamesCount,
    averageScore,
    completedPercentage,
    totalCoins,
  };
}


