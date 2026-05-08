import { Tags } from 'lucide-react';
import { useState } from 'react';
import { AdminFilters } from '@/components/admin/AdminFilters';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminTableCard } from '@/components/admin/AdminTableCard';
import {
  CategoryDialog,
  type CategoryFormValues,
} from '@/components/category/CategoryDialog';
import { CategoryTable } from '@/components/category/CategoryTable';
import { ErrorFeedback } from '@/components/ErrorFeedback';
import { Feedback } from '@/components/Feedback';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/hooks/useCategories';
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/apiError';
import type {
  Category,
  CreateCategoryPayload,
  PaginationMeta,
} from '@/types/api';

const DEFAULT_PAGE_SIZE = 10;
const emptyMeta: PaginationMeta = {
  limit: DEFAULT_PAGE_SIZE,
  page: 1,
  total: 0,
  totalPages: 0,
};

export function CategoriesPage() {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = DEFAULT_PAGE_SIZE;
  const {
    data: categoriesResponse,
    isError,
    isLoading,
  } = useCategories({
    limit,
    name: search,
    page,
  });
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const categories = categoriesResponse?.data ?? [];
  const meta = categoriesResponse?.meta ?? { ...emptyMeta, page, limit };

  const resetFilters = () => {
    setSearch('');
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const createCategorySubmit = async (
    values: CategoryFormValues,
    setFieldError: (name: keyof CreateCategoryPayload, message: string) => void,
  ) => {
    try {
      await createCategory.mutateAsync(values as CreateCategoryPayload);
      setSuccessFeedback('Categoria criada com sucesso.');
    } catch (submissionError) {
      applyCategoryFieldErrors(submissionError, setFieldError);
      setFailureFeedback(submissionError);
      throw submissionError;
    }
  };

  const updateCategorySubmit = async (
    category: Category,
    values: CategoryFormValues,
    setFieldError: (name: keyof CreateCategoryPayload, message: string) => void,
  ) => {
    try {
      await updateCategory.mutateAsync({
        id: category.id,
        payload: values,
      });
      setSuccessFeedback('Categoria atualizada com sucesso.');
    } catch (submissionError) {
      applyCategoryFieldErrors(submissionError, setFieldError);
      setFailureFeedback(submissionError);
      throw submissionError;
    }
  };

  const inactivateCategory = async (category: Category) => {
    try {
      await deleteCategory.mutateAsync(category.id);
      setSuccessFeedback('Categoria inativada com sucesso.');
    } catch (deleteError) {
      setFailureFeedback(deleteError);
    }
  };

  const setSuccessFeedback = (message: string) => {
    setErrorFeedback(null);
    setFeedback(message);
  };

  const setFailureFeedback = (error: unknown) => {
    setFeedback(null);
    setErrorFeedback(getApiErrorMessage(error));
  };

  return (
    <TooltipProvider>
      <div className='mx-auto max-w-6xl space-y-6'>
        <AdminPageHeader
          icon={Tags}
          title='Gestão de categorias'
          description='Cadastre e mantenha categorias de reembolso.'
          action={
            <CategoryDialog
              mode='create'
              isSubmitting={createCategory.isPending}
              onSubmit={createCategorySubmit}
            />
          }
        />

        <Feedback message={feedback} />
        <ErrorFeedback message={errorFeedback} />
        {isError ? (
          <ErrorFeedback message='Não foi possível carregar as categorias.' />
        ) : null}

        <AdminFilters
          searchValue={search}
          onSearchChange={handleSearchChange}
          searchPlaceholder='Buscar por categoria'
          searchLabel='Buscar categorias'
          isEmpty={categories.length === 0 ? true : false}
        />

        <AdminTableCard>
          <CategoryTable
            categories={categories}
            isLoading={isLoading}
            isUpdating={updateCategory.isPending}
            meta={meta}
            onInactivate={inactivateCategory}
            onPageChange={setPage}
            onResetFilters={resetFilters}
            onUpdate={updateCategorySubmit}
          />
        </AdminTableCard>
      </div>
    </TooltipProvider>
  );
}

function applyCategoryFieldErrors(
  error: unknown,
  setFieldError: (name: keyof CreateCategoryPayload, message: string) => void,
) {
  const fieldErrors = getApiFieldErrors(error);

  if (fieldErrors.name?.[0]) {
    setFieldError('name', fieldErrors.name[0]);
  }
}
