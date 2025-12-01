"use client";

import { useEffect, useState } from "react";
import { TablePagination } from "@/components/ui/TablePagination";
import { LevelsGrid } from "@/components/levels/LevelsGrid";
import { LevelService, LevelsResponse } from "@/services/level.service";
import { Level } from "@/types/level";
import { CardHeaderSticky } from "@/components/ui/CardHeaderSticky";

const PAGE_SIZE = 12;

export default function LevelsPage() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [pagination, setPagination] = useState<
    LevelsResponse["meta"]["pagination"]
  >({
    page: 1,
    pageSize: PAGE_SIZE,
    pageCount: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await LevelService.list({
          page: pagination.page,
          pageSize: pagination.pageSize,
        });

        setLevels(res.data || []);
        setPagination(res.meta.pagination);
      } catch (err) {
        console.error("[LevelsPage] Error fetching levels", err);
        setError(
          "No se pudieron cargar los niveles. Inténtalo de nuevo más tarde."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLevels();
  }, [pagination.page, pagination.pageSize]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({
      ...prev,
      page,
    }));
  };

  return (
    <div className="flex flex-col h-full">
      <CardHeaderSticky title="Niveles" />

      <div className="flex-1 p-4 space-y-4">
        {/* Subtítulo descriptivo */}
        <div>
          <p className="text-sm text-muted-foreground">
            Selecciona un nivel para comenzar a jugar
          </p>
        </div>

        {/* Contenido principal */}
        {error ? (
          <div className="text-center py-12">
            <p className="text-destructive">{error}</p>
          </div>
        ) : (
          <div className="space-y-6 flex-1">
            <LevelsGrid levels={levels} isLoading={loading} />
            <TablePagination
              page={pagination.page}
              pageCount={pagination.pageCount}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onPageChange={handlePageChange}
              label="niveles"
            />
          </div>
        )}
      </div>
    </div>
  );
}
