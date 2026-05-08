import { Tags } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AdminFilters } from '@/components/admin/AdminFilters';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminTableCard } from '@/components/admin/AdminTableCard';
import {
  CategoryDialog,
  type CategoryFormValues,
} from '@/components/Category/CategoryDialog';
import { CategoryTable } from '@/components/Category/CategoryTable';
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
import type { Category, CreateCategoryPayload } from '@/types/api';

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

const statusFilterOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: 'Todas', value: 'ALL' },
  { label: 'Ativas', value: 'ACTIVE' },
  { label: 'Inativas', value: 'INACTIVE' },
];

export function CategoriesPage() {
  const { data: categories = [], isError, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const filteredCategories = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return categories.filter((category) => {
      const matchesSearch = category.name.toLowerCase().includes(normalizedSearch);
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && category.active) ||
        (statusFilter === 'INACTIVE' && !category.active);

      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
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
      <div className="mx-auto max-w-6xl space-y-6">
        <AdminPageHeader
          icon={Tags}
          title="Gestão de categorias"
          description="Cadastre e mantenha categorias de reembolso."
          action={
            <CategoryDialog
              mode="create"
              isSubmitting={createCategory.isPending}
              onSubmit={createCategorySubmit}
            />
          }
        />

        <Feedback message={feedback} />
        <ErrorFeedback message={errorFeedback} />
        {isError ? <ErrorFeedback message="Não foi possível carregar as categorias." /> : null}

        <AdminFilters
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por categoria"
          searchLabel="Buscar categorias"
          filterValue={statusFilter}
          onFilterChange={setStatusFilter}
          filterLabel="Filtrar por status"
          filterOptions={statusFilterOptions}
        />

        <AdminTableCard>
          <CategoryTable
            categories={filteredCategories}
            isLoading={isLoading}
            isUpdating={updateCategory.isPending}
            onInactivate={inactivateCategory}
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
