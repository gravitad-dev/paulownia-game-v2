"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoresSummary } from "@/components/scores/ScoresSummary";
import { ScoresTable } from "@/components/scores/ScoresTable";
import { TablePagination } from "@/components/ui/TablePagination";
import { UserGameHistory } from "@/types/user";
import {
  UserGameHistoryService,
  UserGameHistoriesResponse,
} from "@/services/user-game-history.service";

const PAGE_SIZE = 6;

export default function ScoresPage() {
  const { user } = useAuthStore();

  const [histories, setHistories] = useState<UserGameHistory[]>([]);
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

  // Para listar historiales necesitamos el documentId del usuario,
  // ya que la relación en Strapi se guarda contra ese campo.
  const userDocumentId = user?.documentId;
  const hasUserDocumentId = Boolean(userDocumentId);

  useEffect(() => {
    const fetchHistories = async () => {
      if (!hasUserDocumentId || !userDocumentId) return;

      try {
        setLoading(true);
        setError(null);

        const res = await UserGameHistoryService.listByUserDocumentId(
          userDocumentId,
          {
            page: pagination.page,
            pageSize: pagination.pageSize,
          }
        );

        setHistories(res.data || []);
        setPagination(res.meta.pagination);
      } catch (err) {
        console.error("[ScoresPage] Error fetching user game histories", err);
        setError(
          "No se pudo cargar el historial de partidas. Inténtalo de nuevo más tarde."
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
    <>
      <CardHeader className="sticky top-0 z-10 bg-card space-y-0 p-0 shrink-0 border-b border-border/50">
        <div className="flex flex-row items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-3">
          <CardTitle className="text-lg font-semibold sm:text-xl">
            Puntajes
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-4 sm:px-6 sm:py-5">
        {!hasUserDocumentId ? (
          <div className="flex h-full flex-col items-center justify-center text-center py-8">
            <p className="text-sm text-muted-foreground max-w-md">
              No se pudo obtener la información del usuario. Inicia sesión de
              nuevo para ver tu historial de puntajes.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <ScoresSummary histories={histories} />

            <ScoresTable
              data={histories}
              isLoading={loading}
              error={error || undefined}
            />

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
      </CardContent>
    </>
  );
}
