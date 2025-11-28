/**
 * Tipos para el sistema de Canje de Monedas por Tickets
 */

/** Período del límite de canje */
export type ExchangeLimitPeriod = "daily" | "monthly" | "yearly";

/** Estado de una transacción de canje */
export type ExchangeTransactionStatus = "completed" | "pending" | "failed";

/** Estadísticas del jugador (monedas y tickets) */
export interface PlayerStats {
  coins: number;
  tickets: number;
}

/** Información sobre el límite de canje */
export interface ExchangeLimit {
  limitTickets: number;
  period: ExchangeLimitPeriod;
  ticketsUsed: number;
  ticketsRemaining: number;
  nextResetDate: string;
}

/** Elemento del historial de canjes */
export interface ExchangeHistoryItem {
  executedAt: string;
  coinsExchanged: number;
  amountDelivered: number;
  statusTransaction: ExchangeTransactionStatus;
}

/** Estado del canje (canExchange y máximo posible) */
export interface ExchangeStatus {
  canExchange: boolean;
  maxTicketsPossible: number;
}

/** Estadísticas de canje por período */
export interface ExchangeStats {
  ticketsExchanged: number;
  coinsSpent: number;
}

/** Estadísticas agregadas por períodos */
export interface ExchangeStatsAggregate {
  week: ExchangeStats;
  month: ExchangeStats;
  year: ExchangeStats;
  total: ExchangeStats;
}

/**
 * Respuesta del endpoint GET /api/exchangeCoinsToTickets/status
 */
export interface ExchangeStatusResponse {
  status: ExchangeStatus;
  rate: number;
  playerStats: PlayerStats;
  limit?: ExchangeLimit;
  history: ExchangeHistoryItem[];
}

/**
 * Request para POST /api/exchangeCoinsToTickets
 */
export interface ExchangeRequest {
  data: {
    ticketsRequested: number;
  };
}

/**
 * Respuesta exitosa del endpoint POST /api/exchangeCoinsToTickets
 */
export interface ExchangeResponse {
  ticketsExchanged: number;
  coinsSpent: number;
  playerStats: PlayerStats;
  limit?: ExchangeLimit;
  stats: ExchangeStatsAggregate;
  history: ExchangeHistoryItem[];
}

/**
 * Detalles del error de monedas insuficientes
 */
export interface InsufficientCoinsErrorDetails {
  reason: "insufficient_coins";
  maxTicketsPossible: number;
}

/**
 * Detalles del error de límite alcanzado
 */
export interface ExchangeLimitReachedErrorDetails {
  reason: "exchange_limit_reached";
  limitTickets: number;
  period: ExchangeLimitPeriod;
  ticketsUsed: number;
  ticketsRemaining: number;
  nextResetDate: string;
}

/**
 * Unión de todos los tipos de detalles de error
 */
export type ExchangeErrorDetails =
  | InsufficientCoinsErrorDetails
  | ExchangeLimitReachedErrorDetails
  | { reason: "unauthorized" }
  | { reason: "invalid_request" }
  | { reason: "transaction_log_failed" };

/**
 * Estructura de error del API de canje
 */
export interface ExchangeApiError {
  data: null;
  error: {
    status: number;
    name: string;
    message: string;
    details: ExchangeErrorDetails;
  };
}
