export type TopPlayer = {
  rank: number;
  username: string;
  score: number;
  xp: number;
  gamesWon: number;
  gamesPlayed: number;
  winRate: number;
  coins: number;
  tickets: number;
  country?: string | null;
  avatar?: string | null;
};

export interface RankingApiTopPlayer {
  rank: number;
  user?: {
    id?: number;
    username?: string;
    country?: string;
  } | null;
  username?: string | null;
  score: number;
  xp?: number | null;
  gamesWon?: number | null;
  victories?: number | null;
  gamesPlayed?: number | null;
  winRate?: number | null;
  winRatePercent?: number | null;
  winRateFormatted?: string | null;
  coins?: number | null;
  tickets?: number | null;
  country?: string | null;
  avatar?: string | null;
}

export type RankingStats = {
  totalPlayers?: number;
  averageScore?: number;
};

export interface RankingDocument {
  topPlayers?: TopPlayer[];
  stats?: RankingStats;
}

export interface RankingsListResponse {
  data: RankingDocument[];
}

export interface RankingSingleResponse {
  data: RankingDocument;
}

export type RankingApiShape =
  | RankingsListResponse
  | RankingSingleResponse
  | RankingDocument;

export type RankingSortField =
  | "rank"
  | "username"
  | "score"
  | "xp"
  | "gamesWon"
  | "gamesPlayed"
  | "winRate"
  | "coins"
  | "tickets";

export type SortDirection = "asc" | "desc";
