import { httpClient } from '@/services/httpClient';
import type {
  CreateUserPayload,
  GetUsersParams,
  PaginatedResponse,
  PromoteUserPayload,
  UpdateUserPayload,
  User,
} from '@/types/api';

export const userService = {
  async listUsers(params?: GetUsersParams): Promise<PaginatedResponse<User>> {
    const { data } = await httpClient.get<PaginatedResponse<User>>('/users', {
      params: normalizeUsersParams(params),
    });

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

function normalizeUsersParams(params?: GetUsersParams) {
  return {
    ...params,
    name: params?.name?.trim() || undefined,
    role: params?.role || undefined,
  };
}
