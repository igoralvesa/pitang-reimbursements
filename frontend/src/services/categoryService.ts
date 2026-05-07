import { httpClient } from '@/services/httpClient';
import type { Category, CreateCategoryPayload, UpdateCategoryPayload } from '@/types/api';

export const categoryService = {
  async listCategories(): Promise<Category[]> {
    const { data } = await httpClient.get<Category[]>('/categories');

    return data;
  },

  async createCategory(payload: CreateCategoryPayload): Promise<Category> {
    const { data } = await httpClient.post<Category>('/categories', payload);

    return data;
  },

  async updateCategory(id: string, payload: UpdateCategoryPayload): Promise<Category> {
    const { data } = await httpClient.put<Category>(`/categories/${id}`, payload);

    return data;
  },

  async deleteCategory(id: string): Promise<void> {
    await httpClient.delete(`/categories/${id}`);
  },
};
