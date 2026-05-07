import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { Feedback } from '@/components/Feedback';
import { RequestCard } from '@/components/RequestCard';
import { Button } from '@/components/ui/button';
import { useMockData } from '@/contexts/MockDataContext';
import { useAuth } from '@/hooks/useAuth';
import { canCreateRequest } from '@/lib/permissions';
import { roleLabels } from '@/lib/formatters';

export function DashboardPage() {
  const { user } = useAuth();
  const { categories, requests, users } = useMockData();
  const [feedback, setFeedback] = useState<string | null>(null);

  const visibleRequests = useMemo(() => {
    if (!user) {
      return [];
    }

    if (user.role === 'COLLABORATOR') {
      return requests.filter((request) => request.ownerId === user.id);
    }

    if (user.role === 'MANAGER') {
      return requests.filter((request) =>
        ['SUBMITTED', 'APPROVED', 'REJECTED'].includes(request.status),
      );
    }

    if (user.role === 'FINANCE') {
      return requests.filter((request) => request.status === 'APPROVED');
    }

    return requests;
  }, [requests, user]);

  if (!user) {
    return null;
  }

  return (
    <div className='mx-auto max-w-7xl space-y-6'>
      <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-end'>
        <div className='text-left'>
          <p className='text-xs font-semibold uppercase tracking-[0.18em] text-orange-700'>
            Dashboard de {roleLabels[user.role].toLowerCase()}
          </p>
          <h1 className='mt-2 text-3xl font-semibold text-zinc-950 dark:text-zinc-50'>
            Solicitações de reembolso
          </h1>
          <p className='mt-1 text-sm text-zinc-500 dark:text-zinc-400'>
            Solicitações filtradas conforme o perfil autenticado.
          </p>
        </div>
        {canCreateRequest(user) ? (
          <Button asChild className='bg-orange-600 hover:bg-orange-700'>
            <Link to='/requests/new'>
              <Plus className='size-4' />
              Nova solicitação
            </Link>
          </Button>
        ) : null}
      </div>

      <Feedback message={feedback} />

      {visibleRequests.length > 0 ? (
        <div className='grid gap-4 lg:grid-cols-2'>
          {visibleRequests.map((request) => (
            <RequestCard
              key={request.id}
              categories={categories}
              onFeedback={setFeedback}
              request={request}
              user={user}
              users={users}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title='Nenhuma solicitação disponível'
          description='Não há solicitações compatíveis com este perfil no momento.'
        />
      )}
    </div>
  );
}
