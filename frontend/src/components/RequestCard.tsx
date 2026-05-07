import { CalendarDays, CircleDollarSign, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RequestActions } from '@/components/RequestActions';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';
import type { Category, ReimbursementRequest, User } from '@/types/domain';

export function RequestCard({
  categories,
  onFeedback,
  request,
  user,
  users,
}: {
  categories: Category[];
  onFeedback: (message: string) => void;
  request: ReimbursementRequest;
  user: User;
  users: User[];
}) {
  const category = categories.find((item) => item.id === request.categoryId);
  const owner = users.find((item) => item.id === request.ownerId);

  return (
    <Card className="border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <Link to={`/requests/${request.id}`} className="block text-left">
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 text-zinc-950 dark:text-zinc-50">
            {request.id}
            <StatusBadge status={request.status} />
          </CardTitle>
          <p className="line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">{request.description}</p>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-zinc-600 sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <CircleDollarSign className="size-4 text-orange-700" />
            <span className="font-semibold text-zinc-950 dark:text-zinc-50">{formatCurrency(request.amount)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Tag className="size-4 text-orange-700" />
            <span>{category?.name ?? 'Uncategorized'}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-orange-700" />
            <span>{formatDate(request.expenseDate)}</span>
          </div>
          <div className="truncate text-zinc-500 dark:text-zinc-400">Solicitante: {owner?.name ?? 'Desconhecido'}</div>
          <div className="sm:col-span-2 text-xs text-zinc-400 dark:text-zinc-500">
            Atualizado em {formatDateTime(request.updatedAt)}
          </div>
        </CardContent>
      </Link>
      <CardFooter className="justify-between gap-3 bg-zinc-50 dark:bg-zinc-950/60">
        <RequestActions request={request} user={user} onFeedback={onFeedback} />
      </CardFooter>
    </Card>
  );
}
