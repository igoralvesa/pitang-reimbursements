import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RequestStatus } from '@/types/api';
import { reimbursementStatusLabels } from './reimbursementOptions';

const statusStyles: Record<RequestStatus, string> = {
  DRAFT:
    'border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
  SUBMITTED:
    'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
  APPROVED:
    'border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
  REJECTED:
    'border-red-300 bg-red-100 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300',
  PAID:
    'border-sky-300 bg-sky-100 text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300',
  CANCELED:
    'border-stone-300 bg-stone-100 text-stone-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300',
};

export function ReimbursementStatusBadge({ status }: { status: RequestStatus }) {
  return (
    <Badge variant='outline' className={cn('border', statusStyles[status])}>
      {reimbursementStatusLabels[status]}
    </Badge>
  );
}
