import { withBasePath } from "./base.service";
import { User } from "@/types/user";

// Mock logger functions since we don't have the historyLogger module yet
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
const logCreate = async (collection: string, entity: string, id: string, data: any) => console.log(`[CREATE] ${collection} ${entity} ${id}`, data);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const logUpdate = async (collection: string, entity: string, id: string, data: any) => console.log(`[UPDATE] ${collection} ${entity} ${id}`, data);
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
const logDelete = async (collection: string, entity: string, id: string, data: any) => console.log(`[DELETE] ${collection} ${entity} ${id}`, data);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const logError = async (collection: string, action: string, message: string, data: any) => console.error(`[ERROR] ${collection} ${action} ${message}`, data);

const usersApi = withBasePath("/api/users");

type StrapiError = {
  response?: {
    data?: {
      error?: {
        message?: string;
        details?: unknown;
      };
    };
    status?: number;
  };
};

const parseStrapiError = (error: unknown): StrapiError | undefined => {
  if (typeof error === "object" && error !== null && "response" in error) {
    return error as StrapiError;
  }
  return undefined;
};

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  sort?: string;
  search?: string;
}

export type UpdateUserInput = Partial<User>;

export const UserService = {
  async list(params: PaginationQuery = {}): Promise<User[]> {
    const query = new URLSearchParams();
    // IMPORTANTE: Agregar populate para obtener los datos relacionados
    query.set("populate[0]", "role");
    query.set("populate[1]", "profileImage");
    if (params.page) query.set("pagination[page]", String(params.page));
    if (params.pageSize)
      query.set("pagination[pageSize]", String(params.pageSize));
    if (params.sort) query.set("sort", params.sort);
    if (params.search)
      query.set("filters[$or][0][username][$containsi]", params.search);
    const url = `?${query.toString()}`;
    const res = await usersApi.get<User[]>(url);
    return res.data;
  },

  async get(identifier: string): Promise<User> {
    // Intentar obtener por ID numérico primero
    if (!isNaN(Number(identifier))) {
      const res = await usersApi.get<User>(
        `/${identifier}?populate=*`
      );
      return res.data;
    }

    // Si no es numérico, buscar por documentId o username en la lista
    // En Strapi v4/v5 standard, /users suele ser para admin o requiere permisos.
    // /users/me es el endpoint standard para el usuario logueado.
    // Pero seguiremos la logica del ejemplo.

    // Nota: El endpoint /api/users suele devolver array.
    const allUsers = await this.list();
    // Asumimos que identifier puede ser documentId o username
    const user = allUsers.find(
      (u) =>
        String(u.id) === identifier ||
        (u as User).documentId === identifier ||
        u.username === identifier
    );
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    return user;
  },
  
  async getMe(): Promise<User> {
      // IMPORTANTE: guardiands se obtienen por separado usando GuardianService
      const res = await usersApi.get<User>('/me?populate[0]=role&populate[1]=avatar&populate[2]=player_stat');
      return res.data;
  },

  async getById(id: number): Promise<User> {
    // IMPORTANTE: guardiands se obtienen por separado usando GuardianService
    const res = await usersApi.get<User>(
      `/${id}?populate[0]=role&populate[1]=avatar&populate[2]=player_stat`
    );
    return res.data;
  },

  /**
   * Actualiza un usuario en Strapi.
   * 
   * IMPORTANTE: Guardians ahora es una relación oneToMany y se gestiona por separado
   * usando GuardianService. Este método NO debe recibir ni actualizar Guardians.
   * 
   * El endpoint /api/users/:id del plugin users-permissions:
   * - NO usa el wrapper { data: ... } como el Document Service API
   * - Se envía el payload directamente
   * - SOLO acepta ID numérico, NO acepta documentId
   * 
   * @param identifier - ID numérico del usuario (como string)
   * @param input - Datos a actualizar (sin Guardians)
   * @returns Usuario actualizado con los datos de Strapi
   */
  async update(identifier: string, input: UpdateUserInput): Promise<User> {
    try {
      console.log(`[DEBUG] Updating user ${identifier} with payload:`, JSON.stringify(input, null, 2));

      // IMPORTANTE: El endpoint /api/users/:id del plugin users-permissions
      // NO usa el wrapper { data: ... } como el Document Service API.
      // Se envía el payload directamente.
      // NOTA: Guardians se gestiona por separado usando GuardianService
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { guardiands, ...restInput } = input;
      const payload: UpdateUserInput = { ...restInput };

      // El plugin users-permissions SOLO acepta ID numérico, no documentId
      console.log('[DEBUG] Sending PUT request to:', `/api/users/${identifier}`);
      console.log('[DEBUG] Request payload:', JSON.stringify(payload, null, 2));
      
      const res = await usersApi.put<User>(`/${identifier}`, payload);
      const userId = identifier;

      const updatedUser = res.data;

      console.log(
        "[DEBUG] Updated user response:",
        JSON.stringify(updatedUser, null, 2)
      );

      // Registrar en historial (sin bloquear)
      const updatePayload: Record<string, string | number | boolean> = {};
      if (input.username) updatePayload.username = input.username;
      if (input.email) updatePayload.email = input.email;
      
      logUpdate(
        "users",
        "Usuario",
        input.username || userId,
        updatePayload
      ).catch(() => {
        // Ignorar errores de logging silenciosamente
      });

      return updatedUser;
    } catch (error: unknown) {
      const strapiError = parseStrapiError(error);
      const errorData = strapiError?.response?.data;
      console.error('[DEBUG] Update error response:', JSON.stringify(errorData, null, 2));
      console.error('[DEBUG] Update error status:', strapiError?.response?.status);
      console.error('[DEBUG] Update error message:', errorData?.error?.message);
      
      if (errorData?.error?.details) {
        console.error('[DEBUG] Strapi error details:', JSON.stringify(errorData.error.details, null, 2));
      }
      
      logError(
        "users",
        "actualizar usuario",
        `Error al actualizar usuario ${identifier}`,
        {
          identifier,
          error: String(error),
          details: errorData
        }
      ).catch(() => {
        // Ignorar errores de logging
      });
      throw error instanceof Error ? error : new Error('Error al actualizar el usuario');
    }
  },
};
