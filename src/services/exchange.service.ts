import { withBasePath } from "./base.service";
import type {
  ExchangeStatusResponse,
  ExchangeResponse,
} from "@/types/exchange";

const exchangeApi = withBasePath("/api/exchangeCoinsToTickets");

/**
 * Servicio para gestionar el canje de monedas por tickets
 */
export const ExchangeService = {
  /**
   * Obtiene el estado actual del canje.
   * Incluye: estado (canExchange, maxTicketsPossible), tasa, playerStats, límites e historial.
   */
  async getStatus(): Promise<ExchangeStatusResponse> {
    const response = await exchangeApi.get<ExchangeStatusResponse>("/status");
    return response.data;
  },

  /**
   * Ejecuta un canje de monedas por tickets.
   * @param ticketsRequested - Cantidad de tickets que el usuario desea obtener
   * @returns Respuesta con tickets canjeados, monedas gastadas, stats actualizados, etc.
   */
  async exchange(ticketsRequested: number): Promise<ExchangeResponse> {
    const response = await exchangeApi.post<ExchangeResponse>("", {
      data: { ticketsRequested },
    });
    return response.data;
  },
};
