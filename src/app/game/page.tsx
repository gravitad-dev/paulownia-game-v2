"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CardHeaderSticky } from "@/components/ui/CardHeaderSticky";
import { Input } from "@/components/ui/input";

import { TablePagination } from "@/components/ui/TablePagination";
import { api } from "@/lib/api";
import Image from "next/image";
import {
  Trophy,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Medal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCountryIso2, getCountryNameEs } from "@/lib/countries";

type TopPlayer = {
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

interface RankingApiTopPlayer {
  rank: number;
  user?: {
    id?: number;
    username?: string;
    country?: string;
  } | null;
  score: number;
  xp?: number | null;
  gamesWon?: number | null;
  victories?: number | null;
  gamesPlayed?: number | null;
  winRate?: number | null;
  winRateFormatted?: string | null;
  coins?: number | null;
  tickets?: number | null;
  country?: string | null;
  avatar?: string | null;
}

type RankingStats = {
  totalPlayers?: number;
  averageScore?: number;
};

interface RankingDocument {
  topPlayers?: TopPlayer[];
  stats?: RankingStats;
}

interface RankingsListResponse {
  data: RankingDocument[];
}

interface RankingSingleResponse {
  data: RankingDocument;
}

type RankingApiShape =
  | RankingsListResponse
  | RankingSingleResponse
  | RankingDocument;

const PAGE_SIZE = 10;

const normalizeTopPlayers = (items: RankingApiTopPlayer[]): TopPlayer[] => {
  return items.map((item) => ({
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

export default function GamePage() {
  const [players, setPlayers] = useState<TopPlayer[]>([]);
  const [stats, setStats] = useState<RankingStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState<string>("");

  const [sortBy, setSortBy] = useState<string>("rank");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

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
      setPageCount(Math.max(1, Math.ceil(total / PAGE_SIZE)));
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
  }, []);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

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
    const start = (page - 1) * PAGE_SIZE;
    return processedPlayers.slice(start, start + PAGE_SIZE);
  }, [processedPlayers, page]);

  useEffect(() => {
    const total = processedPlayers.length;
    setPageCount(Math.max(1, Math.ceil(total / PAGE_SIZE)));
    if (page > Math.ceil(total / PAGE_SIZE)) {
      setPage(1);
    }
  }, [processedPlayers, page]);

  const handlePageChange = (newPage: number) => setPage(newPage);

  const getDefaultDir = (field: string): "asc" | "desc" => {
    if (field === "rank" || field === "username") return "asc";
    return "desc";
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir(getDefaultDir(field));
    }
    setPage(1);
  };

  return (
    <div className="flex-1 px-4 py-6 bg-transparent">
      <Card className="overflow-hidden">
        <CardHeaderSticky
          title="Ranking de Jugadores"
          subtitle="Top global"
          titleIcon={Trophy}
          actions={
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 w-full">
              <div className="w-full sm:w-96 md:w-md">
                <Input
                  placeholder="Buscar por usuario"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          }
        />
        <CardContent className="px-4 sm:px-6 py-6 rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>Total jugadores: {processedPlayers.length}</span>
                {typeof stats?.averageScore === "number" && (
                  <span>
                    Puntaje promedio: {Math.round(stats.averageScore)}
                  </span>
                )}
              </div>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th
                        className="text-left p-3 font-medium w-16 cursor-pointer select-none"
                        aria-sort={
                          sortBy === "rank"
                            ? sortDir === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                        onClick={() => toggleSort("rank")}
                      >
                        <span className="inline-flex items-center gap-1">
                          #
                          {sortBy === "rank" ? (
                            sortDir === "asc" ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                          )}
                        </span>
                      </th>
                      <th
                        className="text-left p-3 font-medium cursor-pointer select-none"
                        aria-sort={
                          sortBy === "username"
                            ? sortDir === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                        onClick={() => toggleSort("username")}
                      >
                        <span className="inline-flex items-center gap-1">
                          Jugador
                          {sortBy === "username" ? (
                            sortDir === "asc" ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                          )}
                        </span>
                      </th>

                      <th
                        className="text-right p-3 font-medium cursor-pointer select-none"
                        aria-sort={
                          sortBy === "score"
                            ? sortDir === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                        onClick={() => toggleSort("score")}
                      >
                        <span className="inline-flex items-center gap-1">
                          Puntaje
                          {sortBy === "score" ? (
                            sortDir === "asc" ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                          )}
                        </span>
                      </th>
                      <th
                        className="text-right p-3 font-medium hidden sm:table-cell cursor-pointer select-none"
                        aria-sort={
                          sortBy === "xp"
                            ? sortDir === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                        onClick={() => toggleSort("xp")}
                      >
                        <span className="inline-flex items-center gap-1">
                          XP
                          {sortBy === "xp" ? (
                            sortDir === "asc" ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                          )}
                        </span>
                      </th>
                      <th
                        className="text-right p-3 font-medium hidden md:table-cell cursor-pointer select-none"
                        aria-sort={
                          sortBy === "gamesPlayed"
                            ? sortDir === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                        onClick={() => toggleSort("gamesPlayed")}
                      >
                        <span className="inline-flex items-center gap-1">
                          Jugados
                          {sortBy === "gamesPlayed" ? (
                            sortDir === "asc" ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                          )}
                        </span>
                      </th>
                      <th
                        className="text-right p-3 font-medium hidden md:table-cell cursor-pointer select-none"
                        aria-sort={
                          sortBy === "gamesWon"
                            ? sortDir === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                        onClick={() => toggleSort("gamesWon")}
                      >
                        <span className="inline-flex items-center gap-1">
                          Victorias
                          {sortBy === "gamesWon" ? (
                            sortDir === "asc" ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                          )}
                        </span>
                      </th>
                      <th
                        className="text-right p-3 font-medium hidden lg:table-cell cursor-pointer select-none"
                        aria-sort={
                          sortBy === "coins"
                            ? sortDir === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                        onClick={() => toggleSort("coins")}
                      >
                        <span className="inline-flex items-center gap-1">
                          Monedas
                          {sortBy === "coins" ? (
                            sortDir === "asc" ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                          )}
                        </span>
                      </th>
                      <th
                        className="text-right p-3 font-medium hidden lg:table-cell cursor-pointer select-none"
                        aria-sort={
                          sortBy === "tickets"
                            ? sortDir === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                        onClick={() => toggleSort("tickets")}
                      >
                        <span className="inline-flex items-center gap-1">
                          Tickets
                          {sortBy === "tickets" ? (
                            sortDir === "asc" ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                          )}
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedPlayers.map((p) => (
                      <tr
                        key={`${p.username}-${p.rank}`}
                        className={cn(
                          "border-t hover:bg-muted/20",
                          p.rank === 1 &&
                            "bg-linear-to-r from-amber-100/60 to-transparent dark:from-amber-900/25",
                          p.rank === 2 &&
                            "bg-linear-to-r from-zinc-200/60 to-transparent dark:from-zinc-700/25",
                          p.rank === 3 &&
                            "bg-linear-to-r from-orange-200/60 to-transparent dark:from-orange-900/25",
                        )}
                      >
                        <td className="p-3 align-middle text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            {p.rank}
                            {p.rank <= 3 && (
                              <Medal
                                className={cn(
                                  "h-4 w-4",
                                  p.rank === 1 && "text-amber-500",
                                  p.rank === 2 && "text-zinc-400",
                                  p.rank === 3 && "text-orange-500",
                                )}
                              />
                            )}
                          </span>
                        </td>
                        <td className="p-3 align-middle">
                          <div className="flex items-center gap-3">
                            {p.avatar ? (
                              <Image
                                src={
                                  p.avatar.startsWith("http")
                                    ? p.avatar
                                    : `${
                                        process.env.NEXT_PUBLIC_API_URL ||
                                        "http://localhost:1337"
                                      }${p.avatar}`
                                }
                                alt={p.username}
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded-full object-cover border"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-muted border flex items-center justify-center text-xs font-semibold text-muted-foreground">
                                {p.username.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium leading-tight truncate">
                                {p.username}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(() => {
                                  const code = getCountryIso2(p.country);
                                  const name =
                                    getCountryNameEs(p.country) ||
                                    p.country ||
                                    "Sin país";
                                  return (
                                    <>
                                      {code && (
                                        <span
                                          className={`fi fi-${code.toLowerCase()}`}
                                          aria-hidden="true"
                                          style={{ marginRight: 4 }}
                                        />
                                      )}
                                      {name}
                                    </>
                                  );
                                })()}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3 text-right align-middle">
                          {p.score}
                        </td>
                        <td className="p-3 text-right align-middle hidden sm:table-cell">
                          {p.xp}
                        </td>
                        <td className="p-3 text-right align-middle hidden md:table-cell">
                          {p.gamesPlayed}
                        </td>
                        <td className="p-3 text-right align-middle hidden md:table-cell">
                          {p.gamesWon}
                        </td>
                        <td className="p-3 text-right align-middle hidden lg:table-cell">
                          {p.coins}
                        </td>
                        <td className="p-3 text-right align-middle hidden lg:table-cell">
                          {p.tickets}
                        </td>
                      </tr>
                    ))}
                    {pagedPlayers.length === 0 && (
                      <tr className="border-t">
                        <td
                          colSpan={8}
                          className="p-6 text-center text-muted-foreground"
                        >
                          Sin resultados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4">
                <TablePagination
                  page={page}
                  pageCount={pageCount}
                  pageSize={PAGE_SIZE}
                  total={processedPlayers.length}
                  onPageChange={handlePageChange}
                  label="jugadores"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
