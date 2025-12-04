import { withBasePath } from "./base.service";
import {
  UserLevel,
  UserLevelResponse,
  UserLevelsResponse,
} from "@/types/user-level";

const userLevelsApi = withBasePath("/api/user-levels");

export interface UserLevelPaginationParams {
  page?: number;
  pageSize?: number;
  sort?: string;
}

const buildBaseQuery = (
  params: UserLevelPaginationParams = {}
): URLSearchParams => {
  const query = new URLSearchParams();

  if (params.page) {
    query.set("pagination[page]", String(params.page));
  }

  if (params.pageSize) {
    query.set("pagination[pageSize]", String(params.pageSize));
  }

  if (params.sort) {
    query.set("sort", params.sort);
  }

  // Populamos level con todos sus campos (cover, puzzleImage, name, description, difficulty, password, etc.)
  // En Strapi 5, para relaciones anidadas usamos populate[level][populate]=*
  query.set("populate[level][populate]", "*");
  
  // Agregar publicationState para obtener solo los publicados
  query.set("publicationState", "live");

  return query;
};

export const UserLevelService = {
  /**
   * Lista todos los UserLevels (para debug).
   * GET /api/user-levels?populate[level][populate]=*
   */
  async listAll(
    params: UserLevelPaginationParams = {},
    includePublicationState: boolean = true
  ): Promise<UserLevelsResponse> {
    const query = new URLSearchParams();
    
    if (params.page) {
      query.set("pagination[page]", String(params.page));
    }
    if (params.pageSize) {
      query.set("pagination[pageSize]", String(params.pageSize));
    }
    if (params.sort) {
      query.set("sort", params.sort);
    }
    
    query.set("populate[level][populate]", "*");
    
    if (includePublicationState) {
      query.set("publicationState", "live");
    }
    
    const qs = query.toString();
    const url = qs ? `?${qs}` : "";
    const res = await userLevelsApi.get<UserLevelsResponse>(url);
    return res.data;
  },

  /**
   * Lista UserLevels de un usuario por su documentId.
   * GET /api/user-levels?filters[users_permissions_user][documentId][$eq]=<documentId>&populate[level][populate]=*
   */
  async listByUserDocumentId(
    documentId: string,
    params: UserLevelPaginationParams = {}
  ): Promise<UserLevelsResponse> {
    const query = buildBaseQuery(params);
    query.set(
      "filters[users_permissions_user][documentId][$eq]",
      documentId
    );
    const qs = query.toString();
    const url = qs ? `?${qs}` : "";
    const res = await userLevelsApi.get<UserLevelsResponse>(url);
    return res.data;
  },

  /**
   * Lista UserLevels de un usuario por su ID numérico.
   * GET /api/user-levels?filters[users_permissions_user][id][$eq]=<userId>&populate[level][populate]=*
   */
  async listByUserId(
    userId: number,
    params: UserLevelPaginationParams = {}
  ): Promise<UserLevelsResponse> {
    const query = buildBaseQuery(params);
    query.set("filters[users_permissions_user][id][$eq]", String(userId));
    const qs = query.toString();
    const url = qs ? `?${qs}` : "";
    const res = await userLevelsApi.get<UserLevelsResponse>(url);
    return res.data;
  },

  /**
   * Obtiene un UserLevel por el UUID del nivel relacionado.
   * GET /api/user-levels?filters[level][uuid][$eq]=<levelUuid>&populate[level][populate]=*
   */
  async getByLevelUuid(
    levelUuid: string,
    params: UserLevelPaginationParams = {}
  ): Promise<UserLevel | null> {
    const query = buildBaseQuery(params);
    query.set("filters[level][uuid][$eq]", levelUuid);
    query.set("populate[level][populate]", "*");
    const qs = query.toString();
    const url = qs ? `?${qs}` : "";
    const res = await userLevelsApi.get<UserLevelsResponse>(url);
    return res.data.data?.[0] || null;
  },

  /**
   * Obtiene un UserLevel por su UUID.
   * GET /api/user-levels/uuid/:uuid?populate[level][populate]=*
   */
  async getByUuid(uuid: string): Promise<UserLevel> {
    const query = new URLSearchParams();
    query.set("populate[level][populate]", "*");
    const qs = query.toString();
    const url = `/uuid/${uuid}${qs ? `?${qs}` : ""}`;
    const res = await userLevelsApi.get<UserLevelResponse>(url);
    return res.data.data;
  },
};

