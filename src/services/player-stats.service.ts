import { withBasePath } from "./base.service";
import type {
  PlayerStatsSummary,
  PlayerSummaryApiResponse,
  PlayerSummaryData,
} from "@/types/player-stats";

const playerDashboardApi = withBasePath("/api/player-dashboard");

const ensureNumber = (value: unknown, fallback = 0): number => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }
  return value;
};

const clampPercentage = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
};

const calculateRatioPercentage = (current: number, total: number): number => {
  if (total <= 0) return 0;
  return clampPercentage((current / total) * 100);
};

const calculateRankPercentile = (
  rank: number,
  totalPlayers: number,
): number => {
  if (rank <= 0 || totalPlayers <= 0) return 0;
  const raw = (rank / totalPlayers) * 100;
  return clampPercentage(raw);
};

const formatDuration = (seconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  if (safeSeconds === 0) return "0m";

  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

/**
 * Transforma la respuesta plana del API a la estructura organizada del frontend
 */
const transformApiResponse = (
  apiData: PlayerSummaryData,
): PlayerStatsSummary => {
  const coins = ensureNumber(apiData.coins);
  const tickets = ensureNumber(apiData.tickets);
  const coinsEarned = ensureNumber(apiData.coinsEarned);
  const coinsSpent = ensureNumber(apiData.coinsSpent);
  const ticketsEarned = ensureNumber(apiData.ticketsEarned);
  const ticketsSpent = ensureNumber(apiData.ticketsSpent);

  const totalGamesPlayed = ensureNumber(apiData.totalGamesPlayed);
  const gamesWon = ensureNumber(apiData.gamesWon);
  const gamesLost = ensureNumber(
    apiData.gamesLost,
    Math.max(totalGamesPlayed - gamesWon, 0),
  );
  const totalScore = ensureNumber(apiData.totalScore);
  const highestScore = ensureNumber(apiData.highestScore);
  const xp = ensureNumber(apiData.xp);

  const winRateRaw =
    apiData.winRate !== undefined
      ? ensureNumber(apiData.winRate)
      : totalGamesPlayed > 0
      ? (gamesWon / totalGamesPlayed) * 100
      : 0;
  const averageScoreRaw =
    apiData.averageScore !== undefined
      ? ensureNumber(apiData.averageScore)
      : totalGamesPlayed > 0
      ? totalScore / totalGamesPlayed
      : 0;

  const winRate = Number(clampPercentage(winRateRaw).toFixed(2));
  const averageScore = Number(averageScoreRaw.toFixed(2));

  const levelsCompleted = ensureNumber(apiData.levelsCompleted);
  const totalLevels = ensureNumber(apiData.totalLevels);
  const currentLevel = apiData.currentLevel ?? null;
  const levelProgressRaw =
    apiData.levelProgress !== undefined
      ? ensureNumber(apiData.levelProgress)
      : calculateRatioPercentage(levelsCompleted, totalLevels);
  const levelProgress = Number(clampPercentage(levelProgressRaw).toFixed(2));

  const achievementsUnlocked = ensureNumber(apiData.achievementsUnlocked);
  const totalAchievements = ensureNumber(apiData.totalAchievements);
  const achievementProgressRaw =
    apiData.achievementProgress !== undefined
      ? ensureNumber(apiData.achievementProgress)
      : calculateRatioPercentage(achievementsUnlocked, totalAchievements);
  const achievementProgress = Number(
    clampPercentage(achievementProgressRaw).toFixed(2),
  );

  const totalRewardsWon = ensureNumber(apiData.totalRewardsWon);
  const consumablesWon = ensureNumber(apiData.consumablesWon);
  const currencyRewardsWon = ensureNumber(apiData.currencyRewardsWon);
  const cosmeticRewardsWon = ensureNumber(apiData.cosmeticRewardsWon);

  const totalPlayTime = ensureNumber(apiData.totalPlayTime);
  const totalPlayTimeFormatted =
    apiData.totalPlayTimeFormatted ?? formatDuration(totalPlayTime);
  const totalSessionTime = ensureNumber(
    apiData.totalSessionTime,
    totalPlayTime,
  );
  const totalSessionTimeFormatted =
    apiData.totalSessionTimeFormatted ?? formatDuration(totalSessionTime);
  const averageSessionTime = ensureNumber(apiData.averageSessionTime);
  const averageSessionTimeFormatted =
    apiData.averageSessionTimeFormatted ?? formatDuration(averageSessionTime);
  const totalSessions = ensureNumber(apiData.totalSessions);

  const currentStreak = ensureNumber(apiData.currentStreak);
  const longestStreak = ensureNumber(apiData.longestStreak);
  const dailyRewardsClaimed = ensureNumber(apiData.dailyRewardsClaimed);
  const lastPlayedAt = apiData.lastPlayedAt ?? null;
  const lastLoginAt = apiData.lastLoginAt ?? null;

  const hasActiveSession = Boolean(apiData.hasActiveSession);
  const currentSession = apiData.currentSession ?? null;

  const globalRank = ensureNumber(apiData.globalRank);
  const totalPlayers = ensureNumber(apiData.totalPlayers);
  const rankPercentile = Number(
    (apiData.rankPercentile !== undefined
      ? clampPercentage(ensureNumber(apiData.rankPercentile))
      : calculateRankPercentile(globalRank, totalPlayers)
    ).toFixed(2),
  );

  const memberSince = apiData.memberSince ?? new Date().toISOString();

  return {
    basicStats: {
      coins,
      tickets,
      coinsEarned,
      coinsSpent,
      ticketsEarned,
      ticketsSpent,
    },
    gameStats: {
      totalGamesPlayed,
      gamesWon,
      gamesLost,
      winRate,
      totalScore,
      highestScore,
      averageScore,
      xp,
    },
    levels: {
      levelsCompleted,
      totalLevels,
      currentLevel,
      progress: levelProgress,
    },
    achievements: {
      achievementsUnlocked,
      totalAchievements,
      progress: achievementProgress,
    },
    rewards: {
      totalRewardsWon,
      consumablesWon,
      currencyRewardsWon,
      cosmeticRewardsWon,
    },
    time: {
      totalPlayTime,
      totalPlayTimeFormatted,
      totalSessionTime,
      totalSessionTimeFormatted,
      averageSessionTime,
      averageSessionTimeFormatted,
      totalSessions,
    },
    streak: {
      currentStreak,
      longestStreak,
      lastPlayedAt,
      lastLoginAt,
      dailyRewardsClaimed,
    },
    session: {
      hasActiveSession,
      currentSession,
    },
    ranking: {
      globalRank,
      totalPlayers,
      rankPercentile,
    },
    meta: {
      memberSince,
    },
  };
};

/**
 * Valores por defecto cuando el usuario no tiene estadísticas
 */
const getDefaultStats = (memberSince?: string): PlayerStatsSummary => ({
  basicStats: {
    coins: 0,
    tickets: 0,
    coinsEarned: 0,
    coinsSpent: 0,
    ticketsEarned: 0,
    ticketsSpent: 0,
  },
  gameStats: {
    totalGamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    winRate: 0,
    totalScore: 0,
    highestScore: 0,
    averageScore: 0,
    xp: 0,
  },
  levels: {
    levelsCompleted: 0,
    totalLevels: 20,
    currentLevel: null,
    progress: 0,
  },
  achievements: {
    achievementsUnlocked: 0,
    totalAchievements: 50,
    progress: 0,
  },
  rewards: {
    totalRewardsWon: 0,
    consumablesWon: 0,
    currencyRewardsWon: 0,
    cosmeticRewardsWon: 0,
  },
  time: {
    totalPlayTime: 0,
    totalPlayTimeFormatted: "0m",
    totalSessionTime: 0,
    totalSessionTimeFormatted: "0m",
    averageSessionTime: 0,
    averageSessionTimeFormatted: "0m",
    totalSessions: 0,
  },
  streak: {
    currentStreak: 0,
    longestStreak: 0,
    lastPlayedAt: null,
    lastLoginAt: null,
    dailyRewardsClaimed: 0,
  },
  session: {
    hasActiveSession: false,
    currentSession: null,
  },
  ranking: {
    globalRank: 0,
    totalPlayers: 0,
    rankPercentile: 0,
  },
  meta: {
    memberSince: memberSince || new Date().toISOString(),
  },
});

/**
 * Servicio para obtener las estadísticas del jugador
 */
export const PlayerStatsService = {
  /**
   * Obtiene el resumen completo de estadísticas del jugador
   * GET /api/player-dashboard/summary
   * Devuelve valores por defecto si el usuario no tiene estadísticas aún
   */
  async getSummary(memberSince?: string): Promise<PlayerStatsSummary> {
    try {
      const response = await playerDashboardApi.get<PlayerSummaryApiResponse>(
        "/summary",
      );

      const responseData = response.data;

      if (!responseData.data) {
        return getDefaultStats(memberSince);
      }

      return transformApiResponse(responseData.data);
    } catch (error) {
      // Si es error 404, devolver stats por defecto
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      if (err?.status === 404 || err?.response?.status === 404) {
        return getDefaultStats(memberSince);
      }
      throw error;
    }
  },
};
