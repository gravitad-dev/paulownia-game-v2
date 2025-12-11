import { api } from "@/lib/api";
import { AxiosRequestConfig } from "axios";
import {
  AuthResponse,
  ForgotPasswordResponse,
  SendEmailConfirmationResponse,
} from "@/types/user";

export const AuthService = {
  async changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<AuthResponse> {
    const payload = {
      currentPassword,
      password: newPassword,
      passwordConfirmation: confirmPassword,
    };
    const response = await api.post<AuthResponse>(
      "/api/auth/change-password",
      payload,
    );
    return response.data;
  },

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const response = await api.post<ForgotPasswordResponse>(
      "/api/auth/forgot-password",
      { email },
    );
    return response.data;
  },

  async resetPassword(
    code: string,
    password: string,
    passwordConfirmation: string,
  ): Promise<AuthResponse> {
    const payload = { code, password, passwordConfirmation };
    const response = await api.post<AuthResponse>(
      "/api/auth/reset-password",
      payload,
    );
    return response.data;
  },

  async confirmEmail(
    token: string,
  ): Promise<{ email: string; confirmed: boolean }> {
    const response = await api.get<{ email: string; confirmed: boolean }>(
      "/api/auth/email-confirmation",
      {
        params: { confirmation: token, code: token },
        // Evitamos que un error de red (común en redirecciones de Strapi) bloquee la UI globalmente
        skipConnectionCheck: true,
      } as AxiosRequestConfig & { skipConnectionCheck?: boolean },
    );
    return response.data;
  },

  async sendEmailConfirmation(
    email: string,
  ): Promise<SendEmailConfirmationResponse> {
    const response = await api.post<SendEmailConfirmationResponse>(
      "/api/auth/send-email-confirmation",
      { email },
    );
    return response.data;
  },
};
