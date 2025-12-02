/**
 * Tipos para el sistema de reclamos de premios consumibles
 */

export type ClaimStatus =
  | "pending"
  | "processing"
  | "delivered"
  | "rejected"
  | "cancelled";

export type IdentityDocumentType = "dni" | "passport" | "id_card" | "other";

export interface Guardian {
  id: number;
  documentId: string;
  uuid: string;
  name: string;
  lastName: string;
  DNI: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zipcode: string;
  country: string;
  createdAt: string;
  updatedAt: string;
}

export interface RewardClaim {
  id: number;
  documentId: string;
  uuid: string;
  claimCode: string;
  claimStatus: ClaimStatus;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  additionalNotes: string | null;
  trackingNumber: string | null;
  adminNotes: string | null;
  requiresIdentityVerification: boolean;
  isMinor: boolean;
  birthDate: string | null;
  identityDocumentType: IdentityDocumentType | null;
  identityDocumentNumber: string | null;
  identityDocumentFront: number | null;
  identityDocumentBack: number | null;
  guardianEmailConfirmed: boolean;
  guardianEmailConfirmedAt: string | null;
  verificationAttempts: number;
  rejectionReason: string | null;
  processedBy: string | null;
  processedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  guardian?: Guardian;
  rewardSnapshot?: {
    name: string;
    quantity: number;
    typeReward: string;
    description: string;
  };
  userReward?: {
    id: number;
    uuid: string;
    canBeClaimed: boolean;
    hasClaim: boolean;
    claimDeadline: string;
  };
}

export interface CreateClaimData {
  userRewardId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  additionalNotes?: string;
  termsAccepted: boolean;
  dataProcessingAccepted: boolean;
}

export interface CreateClaimResponse {
  data: RewardClaim;
  message: string;
}

export interface GetClaimResponse {
  data: RewardClaim;
}

export interface UploadDocumentsData {
  identityDocumentType: IdentityDocumentType;
  identityDocumentNumber: string;
  birthDate: string; // YYYY-MM-DD
  guardianId?: string;
  guardianData?: {
    name: string;
    lastName: string;
    email: string;
    DNI: string;
    phone?: string;
    address?: string;
    city?: string;
    zipcode?: string;
    country?: string;
  };
  identityDocumentFront?: File;
  identityDocumentBack?: File;
  // Documentos del tutor (solo para menores)
  guardianDocumentFront?: File;
  guardianDocumentBack?: File;
}

export interface ReopenClaimData {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  additionalNotes?: string;
}

export interface ClaimErrorResponse {
  error: {
    status: number;
    message: string;
    details?: {
      reason:
        | "reward_not_claimable"
        | "reward_already_claimed"
        | "claim_deadline_passed"
        | "guardian_required"
        | "max_verification_attempts"
        | "max_resends_reached"
        | "not_owner"
        | "invalid_token"
        | "already_confirmed";
      [key: string]: unknown;
    };
  };
}
