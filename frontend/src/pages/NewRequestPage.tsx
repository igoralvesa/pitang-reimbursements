import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Feedback } from '@/components/Feedback';
import { RequestForm } from '@/components/RequestForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMockData } from '@/contexts/MockDataContext';
import { useAuth } from '@/hooks/useAuth';
import type { RequestFormValues } from '@/types/domain';

export function NewRequestPage() {
  const { user } = useAuth();
  const { categories, createRequest } = useMockData();
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = (values: RequestFormValues) => {
    if (!user) {
      return;
    }

    const request = createRequest(values, user);
    setFeedback(`${request.id} criada como rascunho.`);
    window.setTimeout(() => navigate('/dashboard'), 500);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" className="pl-0">
        <Link to="/dashboard">
          <ArrowLeft className="size-4" />
          Voltar ao dashboard
        </Link>
      </Button>
      <Feedback message={feedback} />
      <Card className="bg-white dark:bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-2xl">Nova solicitação de reembolso</CardTitle>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Crie uma solicitação em rascunho.</p>
        </CardHeader>
        <CardContent>
          <RequestForm categories={categories} onSubmit={handleSubmit} submitLabel="Criar rascunho" />
        </CardContent>
      </Card>
    </div>
  );
}
