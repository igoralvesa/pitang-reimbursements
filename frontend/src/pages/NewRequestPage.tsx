import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AccessDenied } from '@/components/AccessDenied';
import { Feedback } from '@/components/Feedback';
import { RequestForm } from '@/components/RequestForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { useCreateReimbursement } from '@/hooks/useReimbursements';
import { getApiErrorMessage } from '@/lib/apiError';
import type { RequestFormValues } from '@/types/domain';

export function NewRequestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const categoriesQuery = useCategories({ limit: 100 });
  const createReimbursement = useCreateReimbursement();
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!user || user.role !== 'COLLABORATOR') {
    return <AccessDenied />;
  }

  const handleSubmit = async (values: RequestFormValues) => {
    try {
      const reimbursement = await createReimbursement.mutateAsync(values);
      setFeedback(`${reimbursement.id} criada como rascunho.`);
      window.setTimeout(() => navigate(`/requests/${reimbursement.id}`), 500);
    } catch {
      setFeedback(null);
    }
  };

  return (
    <div className='mx-auto max-w-3xl space-y-6'>
      <Button asChild variant='ghost' className='pl-0'>
        <Link to='/dashboard'>
          <ArrowLeft className='size-4' />
          Voltar ao dashboard
        </Link>
      </Button>
      <Feedback message={feedback} />
      {createReimbursement.isError ? (
        <ErrorFeedback message={getApiErrorMessage(createReimbursement.error)} />
      ) : null}
      <Card className='bg-white dark:bg-zinc-900'>
        <CardHeader>
          <CardTitle className='text-2xl'>Nova solicitação de reembolso</CardTitle>
          <p className='text-sm text-zinc-500 dark:text-zinc-400'>
            Crie uma solicitação em rascunho.
          </p>
        </CardHeader>
        <CardContent>
          {categoriesQuery.isLoading ? (
            <p className='text-sm text-zinc-500 dark:text-zinc-400'>
              Carregando categorias...
            </p>
          ) : categoriesQuery.isError ? (
            <ErrorFeedback message={getApiErrorMessage(categoriesQuery.error)} />
          ) : (
            <RequestForm
              categories={categoriesQuery.data?.data ?? []}
              isSubmitting={createReimbursement.isPending}
              onSubmit={(values) => void handleSubmit(values)}
              submitLabel='Criar rascunho'
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ErrorFeedback({ message }: { message: string }) {
  return (
    <Alert variant='destructive'>
      <AlertTitle>Não foi possível salvar a solicitação</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
