import { withBasePath } from "./base.service";
import { Level } from "@/types/level";

const levelsApi = withBasePath("/api/levels");

export interface LevelsResponse {
  data: Level[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface LevelResponse {
  data: Level;
}

export interface LevelPaginationParams {
  page?: number;
  pageSize?: number;
  sort?: string;
}

const buildBaseQuery = (
  params: LevelPaginationParams = {}
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

  // Populamos cover para las imágenes
  query.set("populate[0]", "cover");

  return query;
};

export const LevelService = {
  /**
   * Lista niveles con paginación.
   * GET /api/levels?populate[0]=cover&pagination[page]=1&pagination[pageSize]=12
   */
  async list(params: LevelPaginationParams = {}): Promise<LevelsResponse> {
    const query = buildBaseQuery(params);
    const qs = query.toString();
    const url = qs ? `?${qs}` : "";
    const res = await levelsApi.get<LevelsResponse>(url);
    return res.data;
  },

  /**
   * Obtiene un nivel por su uuid.
   * GET /api/levels/uuid/:uuid?populate=*
   */
  async getByUuid(uuid: string): Promise<Level> {
    const query = new URLSearchParams();
    query.set("populate", "*");
    const qs = query.toString();
    const url = `/uuid/${uuid}${qs ? `?${qs}` : ""}`;
    const res = await levelsApi.get<LevelResponse>(url);
    return res.data.data;
  },
};
