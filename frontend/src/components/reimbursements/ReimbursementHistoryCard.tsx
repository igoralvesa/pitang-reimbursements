import { Clock3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateTime } from '@/lib/date';
import type { HistoryEntry } from '@/types/api';
import { reimbursementHistoryActionLabels } from './reimbursementOptions';

export function ReimbursementHistoryCard({
  actorNamesById = {},
  entries,
  isLoading,
}: {
  actorNamesById?: Record<string, string>;
  entries: HistoryEntry[];
  isLoading: boolean;
}) {
  return (
    <Card className='bg-white dark:bg-zinc-900'>
      <CardHeader>
        <CardTitle>Histórico</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className='text-sm text-zinc-500 dark:text-zinc-400'>
            Carregando histórico...
          </p>
        ) : entries.length === 0 ? (
          <p className='rounded-lg border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'>
            Nenhum histórico registrado.
          </p>
        ) : (
          <div className='max-h-[19.5rem] space-y-3 overflow-y-auto pr-1'>
            {entries.map((entry) => (
              <div
                key={`${entry.action}-${entry.createdAt}-${entry.userId}`}
                className='flex gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900'
              >
                <div className='mt-0.5 rounded-full bg-orange-50 p-2 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300'>
                  <Clock3 className='size-4' />
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <span className='font-medium text-zinc-950 dark:text-zinc-50'>
                      {reimbursementHistoryActionLabels[entry.action]}
                    </span>
                    <span className='text-xs text-zinc-500 dark:text-zinc-400'>
                      por {actorNamesById[entry.userId] ?? 'Usuário desconhecido'}
                    </span>
                  </div>
                  <p className='mt-1 text-sm text-zinc-600 dark:text-zinc-300'>
                    {entry.observation}
                  </p>
                  <p className='mt-2 text-xs text-zinc-400 dark:text-zinc-500'>
                    {formatDateTime(entry.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
