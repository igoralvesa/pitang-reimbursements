import { httpClient } from '@/services/httpClient';
import type {
  Category,
  CreateCategoryPayload,
  GetCategoriesParams,
  PaginatedResponse,
  UpdateCategoryPayload,
} from '@/types/api';

export const categoryService = {
  async listCategories(params?: GetCategoriesParams): Promise<PaginatedResponse<Category>> {
    const { data } = await httpClient.get<PaginatedResponse<Category>>('/categories', {
      params: normalizeCategoriesParams(params),
    });

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

function normalizeCategoriesParams(params?: GetCategoriesParams) {
  return {
    ...params,
    name: params?.name?.trim() || undefined,
  };
}
