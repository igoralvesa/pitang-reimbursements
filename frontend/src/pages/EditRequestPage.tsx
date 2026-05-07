import { ArrowLeft, LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Feedback } from '@/components/Feedback';
import { RequestForm } from '@/components/RequestForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMockData } from '@/contexts/MockDataContext';
import { useAuth } from '@/hooks/useAuth';
import { canEditRequest } from '@/lib/permissions';
import type { RequestFormValues } from '@/types/domain';

export function EditRequestPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { categories, requests, updateRequest } = useMockData();
  const [feedback, setFeedback] = useState<string | null>(null);
  const request = requests.find((item) => item.id === id);

  if (!request || !user) {
    return null;
  }

  const handleSubmit = (values: RequestFormValues) => {
    updateRequest(request.id, values, user);
    setFeedback(`${request.id} atualizada.`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" className="pl-0">
        <Link to={`/requests/${request.id}`}>
          <ArrowLeft className="size-4" />
          Voltar à solicitação
        </Link>
      </Button>
      <Feedback message={feedback} />
      <Card className="bg-white dark:bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-2xl">Editar {request.id}</CardTitle>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Somente rascunhos próprios podem ser editados.</p>
        </CardHeader>
        <CardContent>
          {canEditRequest(user, request) ? (
            <RequestForm
              categories={categories}
              defaultValues={{
                amount: request.amount,
                categoryId: request.categoryId,
                description: request.description,
                expenseDate: request.expenseDate,
              }}
              onSubmit={handleSubmit}
              submitLabel="Salvar rascunho"
            />
          ) : (
            <Alert className="border-amber-200 bg-amber-50">
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
