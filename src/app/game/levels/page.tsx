"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TablePagination } from "@/components/ui/TablePagination";
import { Layers } from "lucide-react";
import { LevelsGrid } from "@/components/levels/LevelsGrid";
import { LevelService, LevelsResponse } from "@/services/level.service";
import { Level } from "@/types/level";

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
    <div className="w-full">
      <Card className="bg-card/80 backdrop-blur-md border-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Layers className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Niveles</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-12">
              <p className="text-destructive">{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
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
        </CardContent>
      </Card>
    </div>
  );
}
