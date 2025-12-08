import { api, isApiError } from "@/lib/api";
import { AxiosError } from "axios";

export type RedeemResponse = {
  message?: string;
  isPremium?: boolean;
};

export type PremiumErrorCode =
  | "MISSING_CODE"
  | "INVALID_CODE"
  | "ALREADY_PREMIUM"
  | "USER_NOT_FOUND"
  | "UNKNOWN_ERROR";

export class PremiumError extends Error {
  constructor(public code: PremiumErrorCode, message: string) {
    super(message);
    this.name = "PremiumError";
  }
}

export const PremiumService = {
  async redeemCode(code: string): Promise<RedeemResponse> {
    try {
      const payload = { code };
      const res = await api.put<RedeemResponse>(
        "/api/premium-codes/redeem",
        payload,
      );
      return res.data;
    } catch (error) {
      if (isApiError(error) && error.originalError) {
        const axiosError = error.originalError as AxiosError<{
          error?: { details?: { errorCode?: string } };
        }>;
        const errorCode = axiosError.response?.data?.error?.details?.errorCode;

        if (errorCode) {
          throw new PremiumError(errorCode as PremiumErrorCode, error.message);
        }
      }
      throw error;
    }
  },
};
