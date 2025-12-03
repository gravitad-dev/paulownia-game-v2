"use client";

import { CatalogGrid, CatalogFilters } from "@/components/game/rewards/catalog";
import { TablePagination } from "@/components/ui/TablePagination";
import { RewardService } from "@/services/reward.service";
import { useCatalogStore } from "@/store/useCatalogStore";
import type { CatalogReward, StrapiPagination } from "@/types/reward";
import { AlertCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CardHeaderSticky } from "@/components/ui/CardHeaderSticky";

const PAGE_SIZE = 8;

/**
 * Filtra premios de tipo currency por nombre (coins vs tickets)
 */
function filterBySubtype(
  rewards: CatalogReward[],
  filter: string,
): CatalogReward[] {
  if (filter === "coins") {
    return rewards.filter((r) => r.name.toLowerCase().includes("coin"));
  }
  if (filter === "tickets") {
    return rewards.filter((r) => r.name.toLowerCase().includes("ticket"));
  }
  return rewards;
}

export default function CatalogPage() {
  const { filter, setFilter } = useCatalogStore();
  const [rewards, setRewards] = useState<CatalogReward[]>([]);
  const [pagination, setPagination] = useState<StrapiPagination | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalog = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await RewardService.getCatalog({
        page,
        pageSize: PAGE_SIZE,
        typeReward: filter,
      });

      // Filtrar en frontend para coins/tickets, pero
      // preservando la paginación original del backend
      const filteredData = filterBySubtype(response.data, filter);
      setRewards(filteredData);
      setPagination(response.meta.pagination);
    } catch (err) {
      console.error("Error fetching catalog:", err);
      setError("No se pudo cargar el catálogo de premios");
      setRewards([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, filter]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  // Reset página cuando cambia el filtro
  useEffect(() => {
    setPage(1);
  }, [filter]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const title = "Catálogo de Premios";

  // Error state
  if (error && !isLoading && rewards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-muted-foreground text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <CardHeaderSticky title={title} />

      <div className="flex-1 p-4 space-y-2">
        {/* Filtros arriba del grid */}
        <div className="flex justify-start">
          <CatalogFilters activeFilter={filter} onFilterChange={setFilter} />
        </div>

        {/* Grid de premios - ocupa todo el ancho disponible */}
        <div className="flex-1">
          <CatalogGrid rewards={rewards} isLoading={isLoading} />
        </div>

        {/* Paginación - siempre al fondo */}
        {pagination && pagination.total > 0 && (
          <div className="pt-3">
            <TablePagination
              page={pagination.page}
              pageCount={pagination.pageCount}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onPageChange={handlePageChange}
              label="premios"
            />
          </div>
        )}
      </div>
    </div>
  );
}
