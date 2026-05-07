import { Clock3 } from 'lucide-react';
import { formatDateTime, historyActionLabels } from '@/lib/formatters';
import type { RequestHistory, User } from '@/types/domain';

export function HistoryTimeline({ entries, users }: { entries: RequestHistory[]; users: User[] }) {
  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const actor = users.find((user) => user.id === entry.userId);

        return (
          <div key={entry.id} className="flex gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mt-0.5 rounded-full bg-orange-50 p-2 text-orange-700">
              <Clock3 className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-zinc-950 dark:text-zinc-50">{historyActionLabels[entry.action]}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">por {actor?.name ?? 'Usuário desconhecido'}</span>
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{entry.observation}</p>
              <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">{formatDateTime(entry.createdAt)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
