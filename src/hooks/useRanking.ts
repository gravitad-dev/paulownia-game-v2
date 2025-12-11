"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { api } from "@/lib/api";
import {
  TopPlayer,
  RankingApiTopPlayer,
  RankingApiShape,
  RankingDocument,
  RankingStats,
  RankingSortField,
  SortDirection,
} from "@/types/ranking";

const DEFAULT_PAGE_SIZE = 10;

const normalizeTopPlayers = (items: RankingApiTopPlayer[]): TopPlayer[] => {
  return items
    .filter((item) => item.user && item.user.username)
    .map((item) => ({
      rank: Number(item.rank) || 0,
      username: item.user?.username || "Jugador",
      score: Number(item.score) || 0,
      xp: Number(item.xp ?? 0) || 0,
      gamesWon: Number(item.victories ?? item.gamesWon ?? 0) || 0,
      gamesPlayed: Number(item.gamesPlayed ?? 0) || 0,
      winRate: (() => {
        const raw = item.winRate;
        if (typeof raw === "number") {
          return raw > 1 ? raw : raw * 100;
        }
        const formatted = item.winRateFormatted;
        if (typeof formatted === "string") {
          const num = parseFloat(formatted.replace("%", ""));
          return isNaN(num) ? 0 : num;
        }
        return 0;
      })(),
      coins: Number(item.coins ?? 0) || 0,
      tickets: Number(item.tickets ?? 0) || 0,
      country: item.user?.country ?? item.country ?? null,
      avatar: item.avatar ?? null,
    }));
};

interface UseRankingOptions {
  pageSize?: number;
  initialSortBy?: RankingSortField;
  initialSortDir?: SortDirection;
  autoFetch?: boolean;
}

interface UseRankingReturn {
  players: TopPlayer[];
  stats: RankingStats | null;
  loading: boolean;
  error: string | null;
  search: string;
  setSearch: (value: string) => void;
  sortBy: RankingSortField;
  sortDir: SortDirection;
  toggleSort: (field: RankingSortField) => void;
  page: number;
  pageCount: number;
  pageSize: number;
  setPage: (page: number) => void;
  processedPlayers: TopPlayer[];
  pagedPlayers: TopPlayer[];
  fetchRanking: () => Promise<void>;
}

export function useRanking(options: UseRankingOptions = {}): UseRankingReturn {
  const {
    pageSize = DEFAULT_PAGE_SIZE,
    initialSortBy = "rank",
    initialSortDir = "asc",
    autoFetch = true,
  } = options;

  const [players, setPlayers] = useState<TopPlayer[]>([]);
  const [stats, setStats] = useState<RankingStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<RankingSortField>(initialSortBy);
  const [sortDir, setSortDir] = useState<SortDirection>(initialSortDir);

  const [page, setPage] = useState<number>(1);
  const [pageCount, setPageCount] = useState<number>(1);

  const fetchRanking = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get<RankingApiShape>("/api/rankings", {
        params: {
          "pagination[page]": 1,
          "pagination[pageSize]": 1,
          sort: "createdAt:desc",
        },
      });

      const raw = response.data as RankingApiShape;
      let latest: RankingDocument = {};
      if ("data" in raw && Array.isArray(raw.data)) {
        latest = raw.data[0] ?? {};
      } else if ("data" in raw && raw.data && typeof raw.data === "object") {
        latest = raw.data as RankingDocument;
      } else {
        latest = raw as RankingDocument;
      }

      const topApi: RankingApiTopPlayer[] = (latest.topPlayers ??
        []) as RankingApiTopPlayer[];
      const normalized = normalizeTopPlayers(topApi);
      const rStats: RankingStats = latest.stats ?? {};

      setPlayers(normalized);
      setStats(rStats || null);

      const total =
        rStats?.totalPlayers && rStats.totalPlayers > 0
          ? rStats.totalPlayers
          : normalized.length;
      setPageCount(Math.max(1, Math.ceil(total / pageSize)));
      setPage(1);
    } catch (err: unknown) {
      let message = "No se pudo cargar el ranking";
      if (err instanceof Error && err.message) {
        message = err.message;
      } else if (
        typeof err === "object" &&
        err !== null &&
        "message" in (err as Record<string, unknown>)
      ) {
        const m = (err as Record<string, unknown>).message;
        if (typeof m === "string") message = m;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    if (autoFetch) {
      fetchRanking();
    }
  }, [autoFetch, fetchRanking]);

  const processedPlayers = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = players;
    if (term) {
      list = list.filter((p) => p.username.toLowerCase().includes(term));
    }

    const getVal = (p: TopPlayer) => {
      switch (sortBy) {
        case "score":
          return p.score;
        case "xp":
          return p.xp;
        case "gamesWon":
          return p.gamesWon;
        case "gamesPlayed":
          return p.gamesPlayed;
        case "winRate":
          return p.winRate;
        case "username":
          return p.username.toLowerCase();
        case "coins":
          return p.coins;
        case "tickets":
          return p.tickets;
        default:
          return p.rank;
      }
    };

    const sorter = (a: TopPlayer, b: TopPlayer) => {
      const va = getVal(a);
      const vb = getVal(b);
      const isString = typeof va === "string" || typeof vb === "string";
      const cmp = isString
        ? String(va).localeCompare(String(vb))
        : Number(va) - Number(vb);
      return sortDir === "asc" ? cmp : -cmp;
    };

    return [...list].sort(sorter);
  }, [players, search, sortBy, sortDir]);

  const pagedPlayers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return processedPlayers.slice(start, start + pageSize);
  }, [processedPlayers, page, pageSize]);

  useEffect(() => {
    const total = processedPlayers.length;
    setPageCount(Math.max(1, Math.ceil(total / pageSize)));
    if (page > Math.ceil(total / pageSize)) {
      setPage(1);
    }
  }, [processedPlayers, page, pageSize]);

  const getDefaultDir = (field: RankingSortField): SortDirection => {
    if (field === "rank" || field === "username") return "asc";
    return "desc";
  };

  const toggleSort = useCallback(
    (field: RankingSortField) => {
      if (sortBy === field) {
        setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortBy(field);
        setSortDir(getDefaultDir(field));
      }
      setPage(1);
    },
    [sortBy],
  );

  const handleSetSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  return {
    players,
    stats,
    loading,
    error,
    search,
    setSearch: handleSetSearch,
    sortBy,
    sortDir,
    toggleSort,
    page,
    pageCount,
    pageSize,
    setPage,
    processedPlayers,
    pagedPlayers,
    fetchRanking,
  };
}
