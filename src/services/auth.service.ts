import { api } from '@/lib/api';
import { AuthResponse } from '@/types/user';

export const AuthService = {
  async changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<AuthResponse> {
    const payload = {
      currentPassword,
      password: newPassword,
      passwordConfirmation: confirmPassword,
    };
    const response = await api.post<AuthResponse>('/api/auth/change-password', payload);
    return response.data;
  },
};


