"use client";

import { Button } from "@/components/ui/button";

export interface TablePaginationProps {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  label?: string;
  blocked?: boolean;
}

export function TablePagination({
  page,
  pageCount,
  pageSize,
  total,
  onPageChange,
  label = "registros",
  blocked,
}: TablePaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(page * pageSize, total);

  const isBlocked = blocked ?? (pageCount <= 1 || total <= pageSize);

  const handlePrev = () => {
    if (isBlocked) return;
    if (page > 1) onPageChange(page - 1);
  };

  const handleNext = () => {
    if (isBlocked) return;
    if (page < pageCount) onPageChange(page + 1);
  };

  return (
    <div
      className={`flex flex-row items-center justify-between gap-3 mt-4 ${
        isBlocked ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      <p className="text-xs text-muted-foreground">
        Mostrando{" "}
        <span className="font-medium">
          {start}-{end}
        </span>{" "}
        de <span className="font-medium">{total}</span> {label}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrev}
          disabled={isBlocked || page <= 1}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={isBlocked || page >= pageCount}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}


