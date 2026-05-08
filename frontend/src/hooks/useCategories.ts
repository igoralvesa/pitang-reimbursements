import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '@/services/categoryService';
import { queryKeys } from '@/lib/queryKeys';
import type { CreateCategoryPayload, GetCategoriesParams, UpdateCategoryPayload } from '@/types/api';

type UpdateCategoryVariables = {
  id: string;
  payload: UpdateCategoryPayload;
};

export function useCategories(params?: GetCategoriesParams) {
  return useQuery({
    queryKey: queryKeys.categories.lists(params),
    queryFn: () => categoryService.listCategories(params),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) => categoryService.createCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: UpdateCategoryVariables) =>
      categoryService.updateCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoryService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
}
