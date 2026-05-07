import { httpClient } from '@/services/httpClient';
import type { AuthenticatedUser, LoginPayload, LoginResponse } from '@/types/api';

export type LoginSession = {
  token: string;
  user: AuthenticatedUser;
};

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await httpClient.post<LoginResponse>('/auth/login', payload);

    return data;
  },

  async getMe(token?: string): Promise<AuthenticatedUser> {
    const { data } = await httpClient.get<AuthenticatedUser>(
      '/auth/me',
      token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : undefined,
    );

    return data;
  },

  async me(token: string): Promise<AuthenticatedUser> {
    return this.getMe(token);
  },
};
