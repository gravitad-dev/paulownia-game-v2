import { withBasePath } from "./base.service";

const guardiansApi = withBasePath("/api/guardiands");

const formatServiceError = (error: unknown) => {
  if (typeof error === "object" && error !== null && "response" in error) {
    const axiosError = error as { response?: { data?: unknown } };
    return axiosError.response?.data ?? error;
  }
  return error;
};

export interface Guardian {
  id: number;
  documentId: string;
  name: string;
  lastName: string;
  DNI: string;
  email?: string;
  phone?: string;
  address?: string;
  zipcode?: string;
  city?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface CreateGuardianInput {
  name: string;
  lastName: string;
  DNI: string;
  email?: string;
  phone?: string;
  address?: string;
  zipcode?: string;
  city?: string;
}

export type UpdateGuardianInput = Partial<CreateGuardianInput>;

export interface GuardiansResponse {
  data: Guardian[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface GuardianResponse {
  data: Guardian;
}

/**
 * Servicio para gestionar Guardians como entidades relacionadas con usuarios.
 * 
 * Los Guardians son una colección independiente relacionada con User mediante
 * una relación oneToMany. Esto permite operaciones CRUD completas sobre cada guardian.
 */
export const GuardianService = {
  /**
   * Obtiene todos los guardians de un usuario específico.
   * 
   * @param userId - ID del usuario propietario de los guardians
   * @returns Array de guardians del usuario
   */
  async listByUser(userId: number): Promise<Guardian[]> {
    try {
      const query = new URLSearchParams();
      // Filtrar por el campo de relación "user" (nombre del campo en Strapi)
      query.set("filters[user][id][$eq]", String(userId));
      query.set("pagination[pageSize]", "100"); // Asumimos que un usuario no tendrá más de 100 guardians
      
      const url = `?${query.toString()}`;
      const res = await guardiansApi.get<GuardiansResponse>(url);
      
      return res.data.data || [];
    } catch (error: unknown) {
      console.error('[GuardianService] Error listing guardians:', formatServiceError(error));
      return [];
    }
  },

  /**
   * Obtiene un guardian específico por su ID.
   * 
   * @param id - ID numérico del guardian
   * @returns Guardian encontrado
   */
  async getById(id: number): Promise<Guardian> {
    const res = await guardiansApi.get<GuardianResponse>(`/${id}`);
    return res.data.data;
  },

  /**
   * Obtiene un guardian específico por su documentId.
   * 
   * @param documentId - documentId del guardian
   * @returns Guardian encontrado
   */
  async getByDocumentId(documentId: string): Promise<Guardian> {
    const query = new URLSearchParams();
    query.set("filters[documentId][$eq]", documentId);
    
    const url = `?${query.toString()}`;
    const res = await guardiansApi.get<GuardiansResponse>(url);
    
    if (!res.data.data || res.data.data.length === 0) {
      throw new Error(`Guardian with documentId ${documentId} not found`);
    }
    
    return res.data.data[0];
  },

  /**
   * Sanitiza el input para excluir campos vacíos antes de enviar a Strapi.
   * Strapi puede rechazar strings vacíos '' para ciertos campos.
   */
  sanitizeInput(input: CreateGuardianInput | UpdateGuardianInput): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(input).filter(([, value]) => {
        // Excluir valores undefined, null, o strings vacíos
        return value !== undefined && value !== null && value !== '';
      })
    );
  },

  /**
   * Crea un nuevo guardian asociado a un usuario.
   * 
   * @param userId - ID del usuario propietario
   * @param input - Datos del guardian a crear
   * @returns Guardian creado
   */
  async create(userId: number, input: CreateGuardianInput): Promise<Guardian> {
    try {
      console.log('[GuardianService] Creating guardian for user:', userId, input);
      
      // Sanitizar input: excluir campos vacíos
      const sanitized = this.sanitizeInput(input);
      
      const payload = {
        data: {
          ...sanitized,
          user: userId, // Relación con el usuario (nombre del campo en Strapi: "user")
        },
      };
      
      const res = await guardiansApi.post<GuardianResponse>('', payload);
      console.log('[GuardianService] Guardian created:', res.data.data);
      
      return res.data.data;
    } catch (error: unknown) {
      console.error('[GuardianService] Error creating guardian:', formatServiceError(error));
      throw error;
    }
  },

  /**
   * Actualiza un guardian existente.
   * 
   * @param documentId - documentId del guardian
   * @param input - Datos a actualizar
   * @returns Guardian actualizado
   */
  async update(documentId: string, input: UpdateGuardianInput): Promise<Guardian> {
    try {
      console.log('[GuardianService] Updating guardian:', documentId, input);
      
      // Sanitizar input: excluir campos vacíos
      const sanitized = this.sanitizeInput(input);
      
      const payload = {
        data: sanitized,
      };
      
      const res = await guardiansApi.put<GuardianResponse>(`/${documentId}`, payload);
      console.log('[GuardianService] Guardian updated:', res.data.data);
      
      return res.data.data;
    } catch (error: unknown) {
      console.error('[GuardianService] Error updating guardian:', formatServiceError(error));
      throw error;
    }
  },

  /**
   * Actualiza un guardian por su documentId.
   * 
   * @param documentId - documentId del guardian
   * @param input - Datos a actualizar
   * @returns Guardian actualizado
   */
  async updateByDocumentId(documentId: string, input: UpdateGuardianInput): Promise<Guardian> {
    try {
      return await this.update(documentId, input);
    } catch (error: unknown) {
      console.error('[GuardianService] Error updating guardian by documentId:', formatServiceError(error));
      throw error;
    }
  },

  /**
   * Elimina un guardian.
   * 
   * @param documentId - documentId del guardian a eliminar
   */
  async delete(documentId: string): Promise<void> {
    try {
      console.log('[GuardianService] Deleting guardian:', documentId);
      await guardiansApi.delete(`/${documentId}`);
      console.log('[GuardianService] Guardian deleted successfully');
    } catch (error: unknown) {
      console.error('[GuardianService] Error deleting guardian:', formatServiceError(error));
      throw error;
    }
  },

  /**
   * Elimina un guardian por su documentId.
   * 
   * @param documentId - documentId del guardian a eliminar
   */
  async deleteByDocumentId(documentId: string): Promise<void> {
    try {
      await this.delete(documentId);
    } catch (error: unknown) {
      console.error('[GuardianService] Error deleting guardian by documentId:', formatServiceError(error));
      throw error;
    }
  },
};

