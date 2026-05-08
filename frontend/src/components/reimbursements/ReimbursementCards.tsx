import {
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  FileText,
  Tag,
  UserRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { TableState } from '@/components/TableState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatDateTime } from '@/lib/date';
import { formatCurrency } from '@/lib/formatters';
import type { ReimbursementRequest } from '@/types/api';
import { ReimbursementStatusBadge } from './ReimbursementStatusBadge';

export function ReimbursementCards({
  isLoading,
  reimbursements,
}: {
  isLoading: boolean;
  reimbursements: ReimbursementRequest[];
}) {
  if (isLoading) {
    return (
      <TableState
        icon={ClipboardList}
        title='Carregando solicitações'
        description='Aguarde enquanto buscamos as solicitações disponíveis para o seu perfil.'
      />
    );
  }

  if (reimbursements.length === 0) {
    return (
      <EmptyState
        title='Nenhuma solicitação disponível'
        description='Não há solicitações compatíveis com os filtros selecionados.'
      />
    );
  }

  return (
    <div className='grid gap-4 lg:grid-cols-2'>
      {reimbursements.map((request) => (
        <Card
          key={request.id}
          className='border-l-4 border-zinc-200 border-l-orange-500 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md dark:border-zinc-800 dark:border-l-orange-500 dark:bg-zinc-900'
        >
          <Link to={`/requests/${request.id}`} className='block text-left'>
            <CardHeader>
              <CardTitle className='flex flex-wrap items-center gap-2 text-zinc-950 dark:text-zinc-50'>
                <span className='inline-flex items-center gap-2'>
                  <span className='rounded-md bg-orange-100 p-1.5 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300'>
                    <FileText className='size-4' />
                  </span>
                  {request.id}
                </span>
                <ReimbursementStatusBadge status={request.status} />
              </CardTitle>
              <p className='line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400'>
                {request.description}
              </p>
            </CardHeader>
            <CardContent className='grid gap-3 text-sm text-zinc-600 sm:grid-cols-2 dark:text-zinc-300'>
              <div className='flex items-center gap-2 rounded-md bg-orange-50 px-2.5 py-2 dark:bg-orange-950/20'>
                <CircleDollarSign className='size-4 text-orange-700 dark:text-orange-300' />
                <span className='font-semibold text-zinc-950 dark:text-zinc-50'>
                  {formatCurrency(Number(request.amount))}
                </span>
              </div>
              <div className='flex items-center gap-2 rounded-md bg-zinc-50 px-2.5 py-2 dark:bg-zinc-950/50'>
                <Tag className='size-4 text-orange-700 dark:text-orange-300' />
                <span>{request.category?.name ?? 'Sem categoria'}</span>
              </div>
              <div className='flex items-center gap-2 rounded-md bg-zinc-50 px-2.5 py-2 dark:bg-zinc-950/50'>
                <CalendarDays className='size-4 text-orange-700 dark:text-orange-300' />
                <span>{formatDate(request.expenseDate)}</span>
              </div>
              <div className='flex items-center gap-2 truncate rounded-md bg-zinc-50 px-2.5 py-2 text-zinc-500 dark:bg-zinc-950/50 dark:text-zinc-400'>
                <UserRound className='size-4 shrink-0 text-orange-700 dark:text-orange-300' />
                <span className='truncate'>
                  Solicitante: {request.requester?.name ?? 'Desconhecido'}
                </span>
              </div>
              <div className='text-xs text-zinc-400 sm:col-span-2 dark:text-zinc-500'>
                Atualizado em {formatDateTime(request.updatedAt)}
              </div>
            </CardContent>
          </Link>
          <CardFooter className='justify-end bg-orange-50/40 dark:bg-orange-950/10'>
            <Button asChild variant='outline' size='sm' className='border-orange-200 text-orange-800 hover:bg-orange-50 dark:border-orange-900 dark:text-orange-300 dark:hover:bg-orange-950/30'>
              <Link to={`/requests/${request.id}`}>Ver detalhes</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
