"use client";

import Image from "next/image";
import { ArrowUpDown, ChevronUp, ChevronDown, Medal } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCountryIso2, getCountryNameEs } from "@/lib/countries";
import { TablePagination } from "@/components/ui/TablePagination";
import {
  TopPlayer,
  RankingStats,
  RankingSortField,
  SortDirection,
} from "@/types/ranking";

interface RankingTableProps {
  players: TopPlayer[];
  stats?: RankingStats | null;
  loading?: boolean;
  error?: string | null;
  sortBy: RankingSortField;
  sortDir: SortDirection;
  onSort: (field: RankingSortField) => void;
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  showStats?: boolean;
  emptyMessage?: string;
}

interface SortableHeaderProps {
  field: RankingSortField;
  label: string;
  sortBy: RankingSortField;
  sortDir: SortDirection;
  onSort: (field: RankingSortField) => void;
  className?: string;
}

function SortableHeader({
  field,
  label,
  sortBy,
  sortDir,
  onSort,
  className,
}: SortableHeaderProps) {
  return (
    <th
      className={cn("p-3 font-medium cursor-pointer select-none", className)}
      aria-sort={
        sortBy === field
          ? sortDir === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortBy === field ? (
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
  );
}

interface PlayerRowProps {
  player: TopPlayer;
}

function PlayerRow({ player: p }: PlayerRowProps) {
  const countryCode = getCountryIso2(p.country);
  const countryName = getCountryNameEs(p.country) || p.country || "Sin país";

  return (
    <tr
      className={cn(
        "border-t hover:bg-muted/20",
        p.rank === 1 &&
          "bg-linear-to-r from-amber-100/60 to-transparent dark:from-amber-900/25",
        p.rank === 2 &&
          "bg-linear-to-r from-zinc-200/60 to-transparent dark:from-zinc-700/25",
        p.rank === 3 &&
          "bg-linear-to-r from-orange-200/60 to-transparent dark:from-orange-900/25"
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
                p.rank === 3 && "text-orange-500"
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
                      process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337"
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
            <p className="font-medium leading-tight truncate">{p.username}</p>
            <p className="text-xs text-muted-foreground">
              {countryCode && (
                <span
                  className={`fi fi-${countryCode.toLowerCase()}`}
                  aria-hidden="true"
                  style={{ marginRight: 4 }}
                />
              )}
              {countryName}
            </p>
          </div>
        </div>
      </td>
      <td className="p-3 text-right align-middle">{p.score}</td>
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
  );
}

export function RankingTable({
  players,
  stats,
  loading = false,
  error = null,
  sortBy,
  sortDir,
  onSort,
  page,
  pageCount,
  pageSize,
  total,
  onPageChange,
  showStats = true,
  emptyMessage = "Sin resultados",
}: RankingTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <>
      {showStats && (
        <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>Total jugadores: {total}</span>
          {typeof stats?.averageScore === "number" && (
            <span>Puntaje promedio: {Math.round(stats.averageScore)}</span>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <SortableHeader
                field="rank"
                label="#"
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
                className="text-left w-16"
              />
              <SortableHeader
                field="username"
                label="Jugador"
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
                className="text-left"
              />
              <SortableHeader
                field="score"
                label="Puntaje"
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
                className="text-right"
              />
              <SortableHeader
                field="xp"
                label="XP"
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
                className="text-right hidden sm:table-cell"
              />
              <SortableHeader
                field="gamesPlayed"
                label="Jugados"
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
                className="text-right hidden md:table-cell"
              />
              <SortableHeader
                field="gamesWon"
                label="Victorias"
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
                className="text-right hidden md:table-cell"
              />
              <SortableHeader
                field="coins"
                label="Monedas"
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
                className="text-right hidden lg:table-cell"
              />
              <SortableHeader
                field="tickets"
                label="Tickets"
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={onSort}
                className="text-right hidden lg:table-cell"
              />
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <PlayerRow key={`${p.username}-${p.rank}`} player={p} />
            ))}
            {players.length === 0 && (
              <tr className="border-t">
                <td
                  colSpan={8}
                  className="p-6 text-center text-muted-foreground"
                >
                  {emptyMessage}
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
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          label="jugadores"
        />
      </div>
    </>
  );
}
