"use client";

import { useEffect, useState, useCallback } from "react";
import { CardHeaderSticky } from "@/components/ui/CardHeaderSticky";
import { TablePagination } from "@/components/ui/TablePagination";
import {
  TransactionHistoryTable,
  TransactionHistorySummary,
  TransactionHistoryFilters,
} from "@/components/game/transactions";
import { TransactionService } from "@/services/transaction.service";
import type {
  UserTransactionHistory,
  TransactionType,
  StrapiPagination,
} from "@/types/transaction";

const PAGE_SIZE = 5;

export default function ChangesPage() {
  const [transactions, setTransactions] = useState<UserTransactionHistory[]>(
    [],
  );
  const [pagination, setPagination] = useState<StrapiPagination>({
    page: 1,
    pageSize: PAGE_SIZE,
    pageCount: 1,
    total: 0,
  });
  const [selectedType, setSelectedType] = useState<TransactionType | "all">(
    "all",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await TransactionService.getUserTransactionHistories({
        page: pagination.page,
        pageSize: PAGE_SIZE,
        transactionType: selectedType === "all" ? undefined : selectedType,
      });

      setTransactions(res.data || []);
      setPagination(res.meta.pagination);
    } catch (err) {
      console.error("[ChangesPage] Error fetching transactions", err);
      setError(
        "No se pudo cargar el historial de canjes. Inténtalo de nuevo más tarde.",
      );
    } finally {
      setLoading(false);
    }
  }, [pagination.page, selectedType]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({
      ...prev,
      page,
    }));
  };

  const handleTypeChange = (type: TransactionType | "all") => {
    setSelectedType(type);
    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  return (
    <div className="flex flex-col h-full">
      <CardHeaderSticky title="Canjes" />
      <div className="flex-1 p-4 flex flex-col gap-4">
        <TransactionHistorySummary
          transactions={transactions}
          selectedType={selectedType}
        />

        <TransactionHistoryFilters
          selectedType={selectedType}
          onTypeChange={handleTypeChange}
        />

        <div className="flex-1 min-h-0">
          <TransactionHistoryTable
            data={transactions}
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
          label="canjes"
        />
      </div>
    </div>
  );
}
