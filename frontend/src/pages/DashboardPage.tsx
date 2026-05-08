import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { ReimbursementCards } from '@/components/reimbursements/ReimbursementCards';
import { ReimbursementFilters } from '@/components/reimbursements/ReimbursementFilters';
import { ReimbursementPagination } from '@/components/reimbursements/ReimbursementPagination';
import { getStatusOptionsForRole } from '@/components/reimbursements/reimbursementOptions';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/hooks/useAuth';
import { useReimbursements } from '@/hooks/useReimbursements';
import { useUsers } from '@/hooks/useUsers';
import { getApiErrorMessage } from '@/lib/apiError';
import { roleLabels } from '@/lib/formatters';
import { canCreateRequest } from '@/lib/permissions';
import { queryKeys } from '@/lib/queryKeys';
import type {
  GetReimbursementsParams,
  PaginatedResponse,
  PaginationMeta,
  ReimbursementRequest,
  RequestStatus,
} from '@/types/api';

const PAGE_SIZE = 10;

const emptyMeta: PaginationMeta = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 0,
};

export function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<RequestStatus | ''>('');
  const [collaboratorId, setCollaboratorId] = useState('');

  const statusOptions = useMemo(
    () => (user ? getStatusOptionsForRole(user.role) : []),
    [user],
  );
  const showCollaboratorFilter = user?.role === 'ADMIN';

  const baseReimbursementParams = useMemo<GetReimbursementsParams>(
    () => ({
      categoryId: categoryId || undefined,
      status: status || undefined,
      collaboratorId:
        user?.role !== 'COLLABORATOR' && collaboratorId ? collaboratorId : undefined,
    }),
    [categoryId, collaboratorId, status, user?.role],
  );

  const reimbursementParams = useMemo<GetReimbursementsParams>(
    () => ({
      ...baseReimbursementParams,
      page,
      limit: PAGE_SIZE,
    }),
    [baseReimbursementParams, page],
  );

  const categoriesQuery = useCategories({ limit: 100 });
  const usersQuery = useUsers(
    { limit: 100, role: 'COLLABORATOR' },
    { enabled: showCollaboratorFilter },
  );
  const reimbursementsQuery = useReimbursements(reimbursementParams, {
    enabled: Boolean(user),
  });

  const categories = categoriesQuery.data?.data ?? [];
  const collaborators = usersQuery.data?.data ?? [];
  const meta = reimbursementsQuery.data?.meta ?? { ...emptyMeta, page };

  const visibleReimbursements = useMemo(() => {
    const items: ReimbursementRequest[] = [];
    const seenIds = new Set<string>();

    for (let pageNumber = 1; pageNumber <= page; pageNumber += 1) {
      const pageParams = {
        ...baseReimbursementParams,
        page: pageNumber,
        limit: PAGE_SIZE,
      };
      const pageResponse =
        pageNumber === meta.page
          ? reimbursementsQuery.data
          : queryClient.getQueryData<PaginatedResponse<ReimbursementRequest>>(
              queryKeys.reimbursements.lists(pageParams),
            );

      pageResponse?.data.forEach((request) => {
        if (!seenIds.has(request.id)) {
          seenIds.add(request.id);
          items.push(request);
        }
      });
    }

    return items;
  }, [baseReimbursementParams, meta.page, page, queryClient, reimbursementsQuery.data]);

  const resetListAndPage = () => setPage(1);

  if (!user) {
    return null;
  }

  if (reimbursementsQuery.isError) {
    return (
      <div className='mx-auto max-w-7xl space-y-6'>
        <PageHeader userRole={user.role} canCreate={canCreateRequest(user)} />
        <EmptyState
          title='Não foi possível carregar as solicitações'
          description={getApiErrorMessage(reimbursementsQuery.error)}
        />
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-7xl space-y-6'>
      <PageHeader userRole={user.role} canCreate={canCreateRequest(user)} />

      <ReimbursementFilters
        categories={categories}
        categoryId={categoryId}
        collaboratorId={collaboratorId}
        collaborators={collaborators}
        showCollaboratorFilter={showCollaboratorFilter}
        status={status}
        statusOptions={statusOptions}
        onCategoryChange={(value) => {
          setCategoryId(value);
          resetListAndPage();
        }}
        onCollaboratorChange={(value) => {
          setCollaboratorId(value);
          resetListAndPage();
        }}
        onStatusChange={(value) => {
          setStatus(value);
          resetListAndPage();
        }}
      />

      <ReimbursementCards
        isLoading={reimbursementsQuery.isLoading && visibleReimbursements.length === 0}
        reimbursements={visibleReimbursements}
      />

      {!reimbursementsQuery.isLoading && visibleReimbursements.length > 0 ? (
        <ReimbursementPagination
          isLoadingMore={reimbursementsQuery.isFetching && page > 1}
          meta={meta}
          onLoadMore={() => setPage((currentPage) => currentPage + 1)}
        />
      ) : null}
    </div>
  );
}

function PageHeader({
  canCreate,
  userRole,
}: {
  canCreate: boolean;
  userRole: keyof typeof roleLabels;
}) {
  return (
    <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-end'>
      <div className='text-left'>
        <p className='text-xs font-semibold uppercase tracking-[0.18em] text-orange-700'>
          Dashboard de {roleLabels[userRole].toLowerCase()}
        </p>
        <h1 className='mt-2 text-3xl font-semibold text-zinc-950 dark:text-zinc-50'>
          Solicitações de reembolso
        </h1>
        <p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
          Solicitações filtradas conforme o perfil autenticado.
        </p>
      </div>
      {canCreate ? (
        <Button asChild className='bg-orange-600 hover:bg-orange-700'>
          <Link to='/requests/new'>
            <Plus className='size-4' />
            Nova solicitação
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
