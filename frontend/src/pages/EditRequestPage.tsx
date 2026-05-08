import { ArrowLeft, LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Feedback } from '@/components/Feedback';
import { RequestForm } from '@/components/RequestForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { useReimbursement, useUpdateReimbursement } from '@/hooks/useReimbursements';
import { getApiErrorMessage } from '@/lib/apiError';
import type { ReimbursementRequest } from '@/types/api';
import type { RequestFormValues, User } from '@/types/domain';

export function EditRequestPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const categoriesQuery = useCategories({ limit: 100 });
  const reimbursementQuery = useReimbursement(id);
  const updateReimbursement = useUpdateReimbursement();
  const [feedback, setFeedback] = useState<string | null>(null);
  const reimbursement = reimbursementQuery.data;

  if (reimbursementQuery.isLoading) {
    return (
      <div className='mx-auto max-w-3xl space-y-6'>
        <p className='text-sm text-zinc-500 dark:text-zinc-400'>
          Carregando solicitação...
        </p>
      </div>
    );
  }

  if (reimbursementQuery.isError || !reimbursement || !user) {
    return (
      <div className='mx-auto max-w-3xl space-y-6'>
        <ErrorFeedback
          title='Solicitação não encontrada'
          message={
            reimbursementQuery.isError
              ? getApiErrorMessage(reimbursementQuery.error)
              : 'A solicitação informada não existe.'
          }
        />
      </div>
    );
  }

  const handleSubmit = async (values: RequestFormValues) => {
    try {
      await updateReimbursement.mutateAsync({
        id: reimbursement.id,
        payload: values,
      });
      setFeedback(`${reimbursement.id} atualizada.`);
      window.setTimeout(() => navigate(`/requests/${reimbursement.id}`), 500);
    } catch {
      setFeedback(null);
    }
  };

  return (
    <div className='mx-auto max-w-3xl space-y-6'>
      <Button asChild variant='ghost' className='pl-0'>
        <Link to={`/requests/${reimbursement.id}`}>
          <ArrowLeft className='size-4' />
          Voltar à solicitação
        </Link>
      </Button>
      <Feedback message={feedback} />
      {updateReimbursement.isError ? (
        <ErrorFeedback
          title='Não foi possível atualizar a solicitação'
          message={getApiErrorMessage(updateReimbursement.error)}
        />
      ) : null}
      <Card className='bg-white dark:bg-zinc-900'>
        <CardHeader>
          <CardTitle className='text-2xl'>Editar {reimbursement.id}</CardTitle>
          <p className='text-sm text-zinc-500 dark:text-zinc-400'>
            Somente rascunhos próprios podem ser editados.
          </p>
        </CardHeader>
        <CardContent>
          {canEditReimbursement(user, reimbursement) ? (
            categoriesQuery.isLoading ? (
              <p className='text-sm text-zinc-500 dark:text-zinc-400'>
                Carregando categorias...
              </p>
            ) : categoriesQuery.isError ? (
              <ErrorFeedback
                title='Não foi possível carregar as categorias'
                message={getApiErrorMessage(categoriesQuery.error)}
              />
            ) : (
              <RequestForm
                categories={categoriesQuery.data?.data ?? []}
                defaultValues={{
                  amount: Number(reimbursement.amount),
                  categoryId: reimbursement.categoryId,
                  description: reimbursement.description,
                  expenseDate: toDateInputValue(reimbursement.expenseDate),
                }}
                isSubmitting={updateReimbursement.isPending}
                onSubmit={(values) => void handleSubmit(values)}
                submitLabel='Salvar rascunho'
              />
            )
          ) : (
            <Alert className='border-amber-200 bg-amber-50'>
              <LockKeyhole />
              <AlertTitle>Esta solicitação está bloqueada</AlertTitle>
              <AlertDescription>
                As regras permitem editar apenas solicitações próprias em rascunho.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function canEditReimbursement(user: User, reimbursement: ReimbursementRequest) {
  return (
    user.role === 'COLLABORATOR' &&
    reimbursement.requesterId === user.id &&
    reimbursement.status === 'DRAFT'
  );
}

function toDateInputValue(value: string) {
  return value.includes('T') ? value.slice(0, 10) : value;
}

function ErrorFeedback({
  message,
  title,
}: {
  message: string;
  title: string;
}) {
  return (
    <Alert variant='destructive'>
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
