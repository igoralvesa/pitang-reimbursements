import { httpClient } from '@/services/httpClient';
import type {
  CreateUserPayload,
  PromoteUserPayload,
  UpdateUserPayload,
  User,
} from '@/types/api';

export const userService = {
  async listUsers(): Promise<User[]> {
    const { data } = await httpClient.get<User[]>('/users');

    return data;
  },

  async getUser(id: string): Promise<User> {
    const { data } = await httpClient.get<User>(`/users/${id}`);

    return data;
  },

  async createUser(payload: CreateUserPayload): Promise<User> {
    const { data } = await httpClient.post<User>('/users', payload);

    return data;
  },

  async updateUser(id: string, payload: UpdateUserPayload): Promise<User> {
    const { data } = await httpClient.patch<User>(`/users/${id}`, payload);

    return data;
  },

  async deleteUser(id: string): Promise<void> {
    await httpClient.delete(`/users/${id}`);
  },

  async promoteUser(id: string, payload: PromoteUserPayload): Promise<User> {
    const { data } = await httpClient.post<User>(`/users/${id}/promote`, payload);

    return data;
  },
};
