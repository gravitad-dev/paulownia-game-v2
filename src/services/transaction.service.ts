import { api } from "@/lib/api";
import type {
  UserTransactionHistoriesResponse,
  TransactionHistoryFilters,
} from "@/types/transaction";

/**
 * Servicio para gestionar el historial de transacciones del usuario
 */
export const TransactionService = {
  /**
   * Obtiene el historial de transacciones del usuario autenticado
   */
  async getUserTransactionHistories(
    filters: TransactionHistoryFilters = {},
  ): Promise<UserTransactionHistoriesResponse> {
    const {
      page = 1,
      pageSize = 5,
      transactionType = "all",
      statusTransaction = "all",
      executedAtFrom,
      executedAtTo,
    } = filters;

    const queryParts: string[] = [
      `pagination[page]=${page}`,
      `pagination[pageSize]=${pageSize}`,
      "sort[0]=executedAt:desc",
    ];

    // Filtrar por tipo de transacción
    if (transactionType && transactionType !== "all") {
      queryParts.push(`filters[transactionType][$eq]=${transactionType}`);
    } else {
      // Por defecto, mostrar solo canjes (excluir recompensas)
      queryParts.push(`filters[transactionType][$in][0]=coins_to_tickets`);
      queryParts.push(`filters[transactionType][$in][1]=coins_to_tokens`);
    }

    // Filtrar por estado si no es "all"
    if (statusTransaction && statusTransaction !== "all") {
      queryParts.push(`filters[statusTransaction][$eq]=${statusTransaction}`);
    }

    // Filtrar por rango de fechas
    if (executedAtFrom) {
      queryParts.push(`filters[executedAt][$gte]=${executedAtFrom}`);
    }
    if (executedAtTo) {
      queryParts.push(`filters[executedAt][$lte]=${executedAtTo}`);
    }

    const response = await api.get<UserTransactionHistoriesResponse>(
      `/api/user-transaction-histories?${queryParts.join("&")}`,
    );

    return response.data;
  },
};
