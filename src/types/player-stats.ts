/**
 * Tipos de estadísticas del jugador alineados con el backend del dashboard.
 * Mantener sincronizado con docs/PLAYER-DASHBOARD.md.
 */

export interface PlayerStats {
  coins: number;
  tickets: number;
}

export type PlayerSessionType = "login" | "game" | "idle";

export interface PlayerSummaryCurrentSession {
  uuid: string;
  sessionType: PlayerSessionType;
  startedAt: string;
  duration: number;
  gamesPlayedInSession?: number;
  scoreInSession?: number;
  coinsEarnedInSession?: number;
}

export interface PlayerSummaryData {
  coins?: number;
  tickets?: number;
  coinsEarned?: number;
  coinsSpent?: number;
  ticketsEarned?: number;
  ticketsSpent?: number;

  totalGamesPlayed?: number;
  gamesWon?: number;
  gamesLost?: number;
  winRate?: number;
  totalScore?: number;
  highestScore?: number;
  averageScore?: number;
  xp?: number;

  levelsCompleted?: number;
  totalLevels?: number;
  currentLevel?: number | null;
  levelProgress?: number;

  achievementsUnlocked?: number;
  totalAchievements?: number;
  achievementProgress?: number;

  totalRewardsWon?: number;
  consumablesWon?: number;
  currencyRewardsWon?: number;
  cosmeticRewardsWon?: number;

  totalPlayTime?: number;
  totalPlayTimeFormatted?: string;
  totalSessionTime?: number;
  totalSessionTimeFormatted?: string;
  averageSessionTime?: number;
  averageSessionTimeFormatted?: string;
  totalSessions?: number;

  currentStreak?: number;
  longestStreak?: number;
  lastPlayedAt?: string | null;
  lastLoginAt?: string | null;
  dailyRewardsClaimed?: number;

  hasActiveSession?: boolean;
  currentSession?: PlayerSummaryCurrentSession | null;

  globalRank?: number;
  totalPlayers?: number;
  rankPercentile?: number;

  memberSince?: string;
}

export interface PlayerSummaryApiResponse {
  data: PlayerSummaryData | null;
}

export interface PlayerStatsSummary {
  basicStats: {
    coins: number;
    tickets: number;
    coinsEarned: number;
    coinsSpent: number;
    ticketsEarned: number;
    ticketsSpent: number;
  };
  gameStats: {
    totalGamesPlayed: number;
    gamesWon: number;
    gamesLost: number;
    winRate: number;
    totalScore: number;
    highestScore: number;
    averageScore: number;
    xp: number;
  };
  levels: {
    levelsCompleted: number;
    totalLevels: number;
    currentLevel: number | null;
    progress: number;
  };
  achievements: {
    achievementsUnlocked: number;
    totalAchievements: number;
    progress: number;
  };
  rewards: {
    totalRewardsWon: number;
    consumablesWon: number;
    currencyRewardsWon: number;
    cosmeticRewardsWon: number;
  };
  time: {
    totalPlayTime: number;
    totalPlayTimeFormatted: string;
    totalSessionTime: number;
    totalSessionTimeFormatted: string;
    averageSessionTime: number;
    averageSessionTimeFormatted: string;
    totalSessions: number;
  };
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastPlayedAt: string | null;
    lastLoginAt: string | null;
    dailyRewardsClaimed: number;
  };
  session: {
    hasActiveSession: boolean;
    currentSession: PlayerSummaryCurrentSession | null;
  };
  ranking: {
    globalRank: number;
    totalPlayers: number;
    rankPercentile: number;
  };
  meta: {
    memberSince: string;
  };
}
