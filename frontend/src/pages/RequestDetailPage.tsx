import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AttachmentList } from '@/components/AttachmentList';
import { EmptyState } from '@/components/EmptyState';
import { Feedback } from '@/components/Feedback';
import { HistoryTimeline } from '@/components/HistoryTimeline';
import { RequestActions } from '@/components/RequestActions';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useMockData } from '@/contexts/MockDataContext';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';

export function RequestDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { categories, requests, users } = useMockData();
  const [feedback, setFeedback] = useState<string | null>(null);
  const request = requests.find((item) => item.id === id);

  if (!request || !user) {
    return <EmptyState title="Solicitação não encontrada" description="A solicitação informada não existe." />;
  }

  const category = categories.find((item) => item.id === request.categoryId);
  const owner = users.find((item) => item.id === request.ownerId);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Button asChild variant="ghost" className="pl-0">
        <Link to="/dashboard">
          <ArrowLeft className="size-4" />
          Voltar ao dashboard
        </Link>
      </Button>

      <Feedback message={feedback} />

      <section className="grid gap-4 lg:grid-cols-[1.6fr_0.9fr]">
        <Card className="bg-white dark:bg-zinc-900">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-3">
              <CardTitle className="text-2xl text-zinc-950 dark:text-zinc-50">
                Detalhes da solicitação {request.id}
              </CardTitle>
              <StatusBadge status={request.status} />
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{request.description}</p>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="Valor" value={formatCurrency(request.amount)} />
            <DetailItem label="Categoria" value={category?.name ?? 'Sem categoria'} />
            <DetailItem label="Data da despesa" value={formatDate(request.expenseDate)} />
            <DetailItem label="Solicitante" value={owner?.name ?? 'Desconhecido'} />
            <DetailItem label="Criado em" value={formatDateTime(request.createdAt)} />
            <DetailItem label="Atualizado em" value={formatDateTime(request.updatedAt)} />
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 text-white">
          <CardHeader>
            <CardTitle className="text-white">Ações disponíveis</CardTitle>
            <p className="text-sm text-zinc-300">Ações exibidas conforme perfil e status da solicitação.</p>
          </CardHeader>
          <CardContent>
            <RequestActions request={request} user={user} onFeedback={setFeedback} />
            <Separator className="my-5 bg-white/10" />
            <p className="text-sm text-zinc-300">
              Administradores e combinações sem permissão permanecem em modo consulta.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="bg-white dark:bg-zinc-900">
          <CardHeader>
            <CardTitle>Anexos</CardTitle>
          </CardHeader>
          <CardContent>
            <AttachmentList attachments={request.attachments} />
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-zinc-900">
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
          </CardHeader>
          <CardContent>
            <HistoryTimeline entries={request.history} users={users} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</div>
      <div className="mt-1 text-sm font-semibold text-zinc-950 dark:text-zinc-50">{value}</div>
    </div>
  );
}
