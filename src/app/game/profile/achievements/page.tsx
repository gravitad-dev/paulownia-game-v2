"use client";

import { useEffect, useState, useCallback } from "react";
import { CardHeaderSticky } from "@/components/ui/CardHeaderSticky";
import { TablePagination } from "@/components/ui/TablePagination";
import {
  AchievementsTable,
  AchievementsSummary,
  AchievementsFilters,
} from "@/components/game/achievements";
import { AchievementsService } from "@/services/achievements.service";
import { useToast } from "@/hooks/useToast";
import { usePlayerStatsStore } from "@/store/usePlayerStatsStore";
import type {
  Achievement,
  AchievementStatus,
  AchievementsPagination,
} from "@/types/achievements";

const PAGE_SIZE = 5;

export default function AchievementsPage() {
  const toast = useToast();
  const { updateCoins, updateTickets } = usePlayerStatsStore();

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [pagination, setPagination] = useState<AchievementsPagination>({
    page: 1,
    pageSize: PAGE_SIZE,
    pageCount: 1,
    total: 0,
  });
  const [selectedStatus, setSelectedStatus] = useState<
    AchievementStatus | "all"
  >("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);

  const fetchAchievements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await AchievementsService.getMyAchievements({
        page: pagination.page,
        pageSize: PAGE_SIZE,
        status: selectedStatus === "all" ? undefined : selectedStatus,
      });

      setAchievements(res.achievements || []);
      setPagination(res.meta.pagination);
    } catch (err) {
      console.error("[AchievementsPage] Error fetching achievements", err);
      setError("No se pudo cargar los logros. Inténtalo de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, selectedStatus]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({
      ...prev,
      page,
    }));
  };

  const handleStatusChange = (status: AchievementStatus | "all") => {
    setSelectedStatus(status);
    setPagination((prev) => ({
      ...prev,
      page: 1, // Reset to first page when changing filter
    }));
  };

  const handleClaim = async (uuid: string) => {
    try {
      setClaiming(uuid);

      const res = await AchievementsService.claimAchievement(uuid);

      // Update player stats
      updateCoins(res.playerStats.coins);
      updateTickets(res.playerStats.tickets);

      // Update achievement in list
      setAchievements((prev) =>
        prev.map((a) =>
          a.uuid === uuid
            ? {
                ...a,
                status: "claimed" as AchievementStatus,
                claimedAt: res.claimedAchievement.claimedAt,
              }
            : a,
        ),
      );

      toast.success(
        "¡Logro reclamado!",
        `Has recibido ${res.claimedAchievement.rewardAmount} ${
          res.claimedAchievement.rewardType === "coins" ? "monedas" : "tickets"
        }`,
      );
    } catch (err: unknown) {
      console.error("[AchievementsPage] Error claiming achievement", err);
      const error = err as {
        response?: { data?: { error?: { message?: string } } };
      };
      toast.error(
        "Error",
        error?.response?.data?.error?.message ||
          "No se pudo reclamar el logro. Inténtalo de nuevo.",
      );
    } finally {
      setClaiming(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <CardHeaderSticky title="Logros" />
      <div className="flex-1 p-4 flex flex-col gap-4">
        <AchievementsSummary achievements={achievements} />

        <AchievementsFilters
          selectedStatus={selectedStatus}
          onStatusChange={handleStatusChange}
        />

        <div className="flex-1 min-h-0">
          <AchievementsTable
            data={achievements}
            isLoading={loading}
            error={error || undefined}
            onClaim={handleClaim}
            claiming={claiming}
          />
        </div>

        <TablePagination
          page={pagination.page}
          pageCount={pagination.pageCount}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onPageChange={handlePageChange}
          label="logros"
        />
      </div>
    </div>
  );
}
