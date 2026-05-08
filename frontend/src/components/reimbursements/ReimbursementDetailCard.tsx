import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatDateTime } from '@/lib/date';
import { formatCurrency } from '@/lib/formatters';
import type { ReimbursementRequest } from '@/types/api';
import { ReimbursementStatusBadge } from './ReimbursementStatusBadge';

export function ReimbursementDetailCard({
  reimbursement,
}: {
  reimbursement: ReimbursementRequest;
}) {
  return (
    <Card className='bg-white dark:bg-zinc-900'>
      <CardHeader>
        <div className='flex flex-wrap items-center gap-3'>
          <CardTitle className='text-2xl text-zinc-950 dark:text-zinc-50'>
            Detalhes da solicitação {reimbursement.id}
          </CardTitle>
          <ReimbursementStatusBadge status={reimbursement.status} />
        </div>
        <p className='text-sm text-zinc-500 dark:text-zinc-400'>
          {reimbursement.description}
        </p>
      </CardHeader>
      <CardContent className='grid gap-4 sm:grid-cols-2'>
        <DetailItem label='Valor' value={formatCurrency(Number(reimbursement.amount))} />
        <DetailItem label='Categoria' value={reimbursement.category?.name ?? 'Sem categoria'} />
        <DetailItem label='Data da despesa' value={formatDate(reimbursement.expenseDate)} />
        <DetailItem
          label='Solicitante'
          value={reimbursement.requester?.name ?? 'Desconhecido'}
        />
        <DetailItem label='Criado em' value={formatDateTime(reimbursement.createdAt)} />
        <DetailItem label='Atualizado em' value={formatDateTime(reimbursement.updatedAt)} />
        {reimbursement.rejectionReason ? (
          <div className='sm:col-span-2'>
            <DetailItem label='Justificativa da rejeição' value={reimbursement.rejectionReason} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/60'>
      <div className='text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400'>
        {label}
      </div>
      <div className='mt-1 text-sm font-semibold text-zinc-950 dark:text-zinc-50'>
        {value}
      </div>
    </div>
  );
}
