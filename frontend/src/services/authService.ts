import { httpClient } from '@/services/httpClient';
import type { User } from '@/types/domain';

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
};

export type LoginSession = {
  token: string;
  user: User;
};

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await httpClient.post<LoginResponse>('/auth/login', payload);

    return data;
  },

  async me(token: string): Promise<User> {
    const { data } = await httpClient.get<User>('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return data;
  },
};
