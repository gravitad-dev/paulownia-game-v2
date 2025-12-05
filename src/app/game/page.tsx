"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CardHeaderSticky } from "@/components/ui/CardHeaderSticky";
import { Input } from "@/components/ui/input";
import { RankingTable } from "@/components/ranking";
import { HeroCard } from "@/components/game/HeroCard";
import { useRanking } from "@/hooks/useRanking";
import { Trophy } from "lucide-react";

export default function GamePage() {
  const {
    stats,
    loading,
    error,
    search,
    setSearch,
    sortBy,
    sortDir,
    toggleSort,
    page,
    pageCount,
    pageSize,
    setPage,
    processedPlayers,
    pagedPlayers,
  } = useRanking();

  return (
    <div className="flex-1 bg-transparent space-y-6">
      {/* Hero Card - Introduction Banner */}
      <HeroCard />
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
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          }
        />
        <CardContent className="px-4 sm:px-6 py-6 rounded-lg">
          <RankingTable
            players={pagedPlayers}
            stats={stats}
            loading={loading}
            error={error}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={toggleSort}
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            total={processedPlayers.length}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
