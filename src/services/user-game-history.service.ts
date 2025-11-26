import { withBasePath } from "./base.service";
import { UserGameHistory } from "@/types/user";

const userGameHistoriesApi = withBasePath("/api/user-game-histories");

export interface UserGameHistoriesResponse {
  data: UserGameHistory[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface UserGameHistoryResponse {
  data: UserGameHistory;
}

export interface UserGameHistoryPaginationParams {
  page?: number;
  pageSize?: number;
}

const buildBaseQuery = (
  params: UserGameHistoryPaginationParams = {}
): URLSearchParams => {
  const query = new URLSearchParams();

  if (params.page) {
    query.set("pagination[page]", String(params.page));
  }

  if (params.pageSize) {
    query.set("pagination[pageSize]", String(params.pageSize));
  }

  // Siempre populamos todo para poder mostrar level, etc.
  query.set("populate", "*");

  return query;
};

export const UserGameHistoryService = {
  /**
   * Lista historiales de juego de un usuario filtrando por el documentId
   * del usuario en la relación `users_permissions_user`.
   *
   * GET /api/user-game-histories?populate=*&filters[users_permissions_user][documentId][$eq]=<documentId>
   */
  async listByUserDocumentId(
    userDocumentId: string,
    params: UserGameHistoryPaginationParams = {}
  ): Promise<UserGameHistoriesResponse> {
    const query = buildBaseQuery(params);

    query.set(
      "filters[users_permissions_user][documentId][$eq]",
      userDocumentId
    );

    const qs = query.toString();
    const url = qs ? `?${qs}` : "";
    const res = await userGameHistoriesApi.get<UserGameHistoriesResponse>(url);
    return res.data;
  },

  /**
   * Obtiene un solo historial por su uuid propio.
   */
  async getByUuid(uuid: string): Promise<UserGameHistory> {
    const res =
      await userGameHistoriesApi.get<UserGameHistoryResponse>(`/uuid/${uuid}`);
    return res.data.data;
  },

  /**
   * Actualiza un historial existente usando su uuid.
   */
  async updateByUuid(
    uuid: string,
    data: Partial<UserGameHistory>
  ): Promise<UserGameHistory> {
    const payload = {
      data,
    };
    const res = await userGameHistoriesApi.put<UserGameHistoryResponse>(
      `/uuid/${uuid}`,
      payload
    );
    return res.data.data;
  },

  /**
   * Elimina un historial por su uuid.
   */
  async deleteByUuid(uuid: string): Promise<void> {
    await userGameHistoriesApi.delete(`/uuid/${uuid}`);
  },
};


