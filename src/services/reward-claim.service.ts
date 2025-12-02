import { api } from "@/lib/api";
import type {
  CreateClaimData,
  CreateClaimResponse,
  GetClaimResponse,
  RewardClaim,
  UploadDocumentsData,
  ReopenClaimData,
} from "@/types/reward-claim";

/**
 * Servicio para gestionar reclamos de premios consumibles
 */
export const RewardClaimService = {
  /**
   * Crea un nuevo reclamo para un premio consumible
   */
  createClaim: async (data: CreateClaimData): Promise<CreateClaimResponse> => {
    try {
      const response = await api.post<CreateClaimResponse>(
        "/api/reward-claims",
        {
          data,
        },
      );
      return response.data;
    } catch (error: unknown) {
      throw error;
    }
  },

  /**
   * Obtiene un reclamo por su código usando filtros de Strapi
   */
  getClaimByCode: async (claimCode: string): Promise<GetClaimResponse> => {
    const response = await api.get<{ data: RewardClaim[] }>(
      `/api/reward-claims`,
      {
        params: {
          "filters[claimCode][$eq]": claimCode,
          populate: "*",
        },
      },
    );
    if (!response.data.data || response.data.data.length === 0) {
      throw new Error("Reclamo no encontrado");
    }
    return { data: response.data.data[0] };
  },

  /**
   * Obtiene el reclamo asociado a un user_reward por su UUID
   * Usa filtros de Strapi para buscar por user_reward.uuid
   */
  getClaimByUserRewardId: async (
    userRewardUuid: string,
  ): Promise<GetClaimResponse> => {
    const response = await api.get<{ data: RewardClaim[] }>(
      `/api/reward-claims`,
      {
        params: {
          "filters[user_reward][uuid][$eq]": userRewardUuid,
          populate: "*",
        },
      },
    );
    // Strapi devuelve un array, tomamos el primero
    if (!response.data.data || response.data.data.length === 0) {
      throw new Error("Reclamo no encontrado");
    }
    return { data: response.data.data[0] };
  },

  /**
   * Cancela un reclamo
   */
  cancelClaim: async (claimCode: string): Promise<GetClaimResponse> => {
    const response = await api.post<GetClaimResponse>(
      `/api/reward-claims/cancel`,
      { claimCode },
    );
    return response.data;
  },

  /**
   * Reabre un reclamo cancelado (con opción de actualizar datos)
   */
  reopenClaim: async (
    claimCode: string,
    data?: ReopenClaimData,
  ): Promise<GetClaimResponse> => {
    const response = await api.post<GetClaimResponse>(
      `/api/reward-claims/reopen`,
      { claimCode, data },
    );
    return response.data;
  },

  /**
   * Sube documentos de identidad para verificación
   */
  uploadDocuments: async (
    claimCode: string,
    data: UploadDocumentsData,
  ): Promise<GetClaimResponse> => {
    const formData = new FormData();

    // Código del reclamo
    formData.append("claimCode", claimCode);

    // Campos de texto
    formData.append("identityDocumentType", data.identityDocumentType);
    formData.append("identityDocumentNumber", data.identityDocumentNumber);
    formData.append("birthDate", data.birthDate);

    // Guardian (si aplica)
    if (data.guardianId) {
      formData.append("guardianId", data.guardianId);
    } else if (data.guardianData) {
      formData.append("guardianData", JSON.stringify(data.guardianData));
    }

    // Archivos del usuario
    if (data.identityDocumentFront) {
      formData.append("identityDocumentFront", data.identityDocumentFront);
    }
    if (data.identityDocumentBack) {
      formData.append("identityDocumentBack", data.identityDocumentBack);
    }

    // Archivos del guardián (si aplica)
    if (data.guardianDocumentFront) {
      formData.append("guardianDocumentFront", data.guardianDocumentFront);
    }
    if (data.guardianDocumentBack) {
      formData.append("guardianDocumentBack", data.guardianDocumentBack);
    }

    const response = await api.post<GetClaimResponse>(
      `/api/reward-claims/upload-documents`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },
};
