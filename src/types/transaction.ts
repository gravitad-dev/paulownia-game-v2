/**
 * Tipos para el historial de transacciones del usuario
 */

export type TransactionType =
  | "coins_to_tickets"
  | "coins_to_tokens"
  | "daily_reward"
  | "achievement_reward"
  | "level_reward"
  | "other";
export type TransactionStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface UserTransactionHistory {
  id: number;
  documentId: string;
  uuid: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  transactionType: TransactionType;
  statusTransaction: TransactionStatus;
  // Campos reales del backend
  coinsExchanged: number;
  amountDelivered: number;
  currency: string; // "coins" para el origen
  executedAt: string;
}

export interface StrapiPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface UserTransactionHistoriesResponse {
  data: UserTransactionHistory[];
  meta: {
    pagination: StrapiPagination;
  };
}

export interface TransactionHistoryFilters {
  page?: number;
  pageSize?: number;
  transactionType?: TransactionType | "all";
  statusTransaction?: TransactionStatus | "all";
  executedAtFrom?: string;
  executedAtTo?: string;
}
