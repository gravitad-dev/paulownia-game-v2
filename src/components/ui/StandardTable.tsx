import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type HeaderConfig = {
  key: string;
  label: ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
};

interface StandardTableProps<T> {
  headers: HeaderConfig[];
  rows: T[];
  renderRow: (row: T, index: number) => ReactNode;
  isLoading?: boolean;
  error?: string;
  emptyState?: ReactNode;
  loadingContent?: ReactNode;
  minRows?: number;
  rowHeightClass?: string;
  containerClassName?: string;
  tableClassName?: string;
}

const DEFAULT_MIN_ROWS = 5;
const DEFAULT_ROW_HEIGHT_CLASS = "[&>tr]:h-[70px] [&>tr>td]:align-middle";

export function StandardTable<T>({
  headers,
  rows,
  renderRow,
  isLoading = false,
  error,
  emptyState,
  loadingContent,
  minRows = DEFAULT_MIN_ROWS,
  rowHeightClass = DEFAULT_ROW_HEIGHT_CLASS,
  containerClassName,
  tableClassName,
}: StandardTableProps<T>) {
  const safeRows = rows ?? [];

  const renderHeaderAlign = (align?: HeaderConfig["align"]) => {
    if (align === "center") return "text-center";
    if (align === "right") return "text-right";
    return "text-left";
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          "overflow-x-auto rounded-lg border border-border/60 bg-card/40",
          containerClassName,
        )}
      >
        {loadingContent ?? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "overflow-x-auto rounded-lg border border-border/60 bg-card/40",
          containerClassName,
        )}
      >
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  if (!safeRows.length) {
    return (
      <div
        className={cn(
          "overflow-x-auto rounded-lg border border-border/60 bg-card/40",
          containerClassName,
        )}
      >
        {emptyState ?? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">Sin datos disponibles</p>
          </div>
        )}
      </div>
    );
  }

  const emptyRowsCount =
    safeRows.length < minRows ? minRows - safeRows.length : 0;

  return (
    <div
      className={cn(
        "overflow-x-auto rounded-lg border border-border/60 bg-card/40",
        containerClassName,
      )}
    >
      <table className={cn("w-full text-sm", tableClassName)}>
        <thead className="bg-muted/50">
          <tr>
            {headers.map((header) => (
              <th
                key={header.key}
                className={cn(
                  "px-3 py-3 font-medium text-muted-foreground",
                  renderHeaderAlign(header.align),
                  header.className,
                )}
              >
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={cn(rowHeightClass)}>
          {safeRows.map((row, index) => renderRow(row, index))}

          {emptyRowsCount > 0 &&
            Array.from({ length: emptyRowsCount }).map((_, fillerIndex) => (
              <tr
                key={`empty-row-${fillerIndex}`}
                className="border-t border-border/40"
              >
                <td colSpan={headers.length} className="px-3">&nbsp;</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

