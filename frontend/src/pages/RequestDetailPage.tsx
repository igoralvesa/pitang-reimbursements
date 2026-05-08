import { ArrowLeft } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { ReimbursementAttachmentsCard } from '@/components/reimbursements/ReimbursementAttachmentsCard';
import { ReimbursementConsultationCard } from '@/components/reimbursements/ReimbursementConsultationCard';
import { ReimbursementDetailCard } from '@/components/reimbursements/ReimbursementDetailCard';
import { ReimbursementHistoryCard } from '@/components/reimbursements/ReimbursementHistoryCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useReimbursement, useReimbursementHistory } from '@/hooks/useReimbursements';
import { getApiErrorMessage } from '@/lib/apiError';

export function RequestDetailPage() {
  const { id } = useParams();
  const reimbursementQuery = useReimbursement(id);
  const historyQuery = useReimbursementHistory(id);
  const reimbursement = reimbursementQuery.data;
  const history = historyQuery.data ?? [];

  const actorNamesById = useMemo(() => {
    const names: Record<string, string> = {};

    if (reimbursement?.requester) {
      names[reimbursement.requester.id] = reimbursement.requester.name;
    }

    reimbursement?.histories?.forEach((entry) => {
      if (entry.user) {
        names[entry.user.id] = entry.user.name;
      }
    });

    return names;
  }, [reimbursement]);

  if (!id) {
    return (
      <EmptyState
        title='Solicitação não encontrada'
        description='A solicitação informada não existe.'
      />
    );
  }

  if (reimbursementQuery.isLoading) {
    return (
      <div className='mx-auto max-w-6xl space-y-6'>
        <BackButton />
        <Card className='bg-white dark:bg-zinc-900'>
          <CardContent className='py-10 text-sm text-zinc-500 dark:text-zinc-400'>
            Carregando solicitação...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (reimbursementQuery.isError || !reimbursement) {
    return (
      <div className='mx-auto max-w-6xl space-y-6'>
        <BackButton />
        <EmptyState
          title='Solicitação não encontrada'
          description={
            reimbursementQuery.isError
              ? getApiErrorMessage(reimbursementQuery.error)
              : 'A solicitação informada não existe.'
          }
        />
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-6xl space-y-6'>
      <BackButton />

      <section className='grid gap-4 lg:grid-cols-[1.6fr_0.9fr]'>
        <ReimbursementDetailCard reimbursement={reimbursement} />
        <ReimbursementConsultationCard />
      </section>

      <section className='grid gap-4 lg:grid-cols-[1fr_1fr]'>
        <ReimbursementAttachmentsCard attachments={reimbursement.attachments ?? []} />
        <ReimbursementHistoryCard
          actorNamesById={actorNamesById}
          entries={history}
          isLoading={historyQuery.isLoading}
        />
      </section>
    </div>
  );
}

function BackButton() {
  return (
    <Button asChild variant='ghost' className='pl-0'>
      <Link to='/dashboard'>
        <ArrowLeft className='size-4' />
        Voltar ao dashboard
      </Link>
    </Button>
  );
}
