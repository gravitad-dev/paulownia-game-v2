"use client";

import { useEffect, useState, useCallback } from "react";
import { CardHeaderSticky } from "@/components/ui/CardHeaderSticky";
import { TablePagination } from "@/components/ui/TablePagination";
import {
  UserRewardsTable,
  UserRewardsSummary,
  UserRewardsFilters,
} from "@/components/game/rewards";
import { ContentLoading } from "@/components/ui/ContentLoading";
import { RewardService } from "@/services/reward.service";
import { useNotificationStore } from "@/store/useNotificationStore";
import type {
  UserRewardDetailed,
  RewardStatus,
  StrapiPagination,
} from "@/types/reward";

const PAGE_SIZE = 5;

export default function AwardsPage() {
  const [rewards, setRewards] = useState<UserRewardDetailed[]>([]);
  const [pagination, setPagination] = useState<StrapiPagination>({
    page: 1,
    pageSize: PAGE_SIZE,
    pageCount: 1,
    total: 0,
  });
  const [selectedStatus, setSelectedStatus] = useState<RewardStatus | "all">(
    "all",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRewards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await RewardService.getUserRewards({
        page: pagination.page,
        pageSize: PAGE_SIZE,
        rewardStatus: selectedStatus === "all" ? undefined : selectedStatus,
      });

      setRewards(res.data || []);
      setPagination(res.meta.pagination);
    } catch (err) {
      console.error("[AwardsPage] Error fetching user rewards", err);
      setError("No se pudo cargar los premios. Inténtalo de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, selectedStatus]);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({
      ...prev,
      page,
    }));
  };

  const handleStatusChange = (status: RewardStatus | "all") => {
    setSelectedStatus(status);
    setPagination((prev) => ({
      ...prev,
      page: 1, // Reset to first page when changing filter
    }));
  };

  const handleClaimSuccess = () => {
    fetchRewards();
    // Forzar actualización de notificaciones para reflejar el nuevo estado
    useNotificationStore.getState().fetchNotifications();
  };

  return (
    <div className="flex flex-col h-full">
      <CardHeaderSticky title="Premios" />
      <div className="flex-1 p-4 flex flex-col gap-4">
        {loading ? (
          <ContentLoading message="Cargando premios..." />
        ) : (
          <>
            <UserRewardsSummary rewards={rewards} />

            <UserRewardsFilters
              selectedStatus={selectedStatus}
              onStatusChange={handleStatusChange}
            />

            <div className="flex-1 min-h-0">
              <UserRewardsTable
                data={rewards}
                isLoading={loading}
                error={error || undefined}
                onClaimSuccess={handleClaimSuccess}
              />
            </div>

            <TablePagination
              page={pagination.page}
              pageCount={pagination.pageCount}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onPageChange={handlePageChange}
              label="premios"
            />
          </>
        )}
      </div>
    </div>
  );
}
