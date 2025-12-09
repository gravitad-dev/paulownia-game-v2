"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { ContentLoading } from "@/components/ui/ContentLoading";
import { ScoresSummary } from "@/components/scores/ScoresSummary";
import { ScoresTable } from "@/components/scores/ScoresTable";
import { TablePagination } from "@/components/ui/TablePagination";
import { UserGameHistory } from "@/types/user";
import {
  UserGameHistoryService,
  UserGameHistoriesResponse,
} from "@/services/user-game-history.service";
import { CardHeaderSticky } from "@/components/ui/CardHeaderSticky";
import { DEFAULT_SUMMARY_LIMIT } from "@/lib/scores";

const PAGE_SIZE = 5;

export default function ScoresPage() {
  const { user } = useAuthStore();

  const [histories, setHistories] = useState<UserGameHistory[]>([]);
  const [summaryHistories, setSummaryHistories] = useState<UserGameHistory[]>(
    [],
  );
  const [pagination, setPagination] = useState<
    UserGameHistoriesResponse["meta"]["pagination"]
  >({
    page: 1,
    pageSize: PAGE_SIZE,
    pageCount: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userDocumentId = user?.documentId;
  const hasUserDocumentId = Boolean(userDocumentId);

  useEffect(() => {
    const fetchHistories = async () => {
      if (!hasUserDocumentId || !userDocumentId) return;

      try {
        setLoading(true);
        setError(null);

        const [tableRes, summaryRes] = await Promise.all([
          UserGameHistoryService.listByUserDocumentId(userDocumentId, {
            page: pagination.page,
            pageSize: pagination.pageSize,
          }),
          UserGameHistoryService.listByUserDocumentId(userDocumentId, {
            page: 1,
            pageSize: DEFAULT_SUMMARY_LIMIT,
          }),
        ]);

        setHistories(tableRes.data || []);
        setPagination(tableRes.meta.pagination);
        setSummaryHistories(summaryRes.data || []);
      } catch (err) {
        console.error("[ScoresPage] Error fetching user game histories", err);
        setError(
          "No se pudo cargar el historial de partidas. Inténtalo de nuevo más tarde.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchHistories();
  }, [hasUserDocumentId, userDocumentId, pagination.page, pagination.pageSize]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({
      ...prev,
      page,
    }));
  };

  return (
    <div className="flex flex-col h-full">
      <CardHeaderSticky title="Puntajes" />
      <div className="flex-1 p-4 flex flex-col">
        {loading ? (
          <ContentLoading message="Cargando puntajes..." />
        ) : !hasUserDocumentId ? (
          <div className="flex h-full flex-col items-center justify-center text-center py-8">
            <p className="text-sm text-muted-foreground max-w-md">
              No se pudo obtener la información del usuario. Inicia sesión de
              nuevo para ver tu historial de puntajes.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col gap-4">
            <ScoresSummary
              histories={summaryHistories}
              limit={DEFAULT_SUMMARY_LIMIT}
            />

            <div className="flex-1 min-h-0">
              <ScoresTable
                data={histories}
                isLoading={loading}
                error={error || undefined}
              />
            </div>

            <TablePagination
              page={pagination.page}
              pageCount={pagination.pageCount}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onPageChange={handlePageChange}
              label="partidas"
            />
          </div>
        )}
      </div>
    </div>
  );
}
