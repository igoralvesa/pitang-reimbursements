import { Inbox } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border-dashed bg-white/80 dark:bg-zinc-900/80">
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="rounded-full bg-orange-50 p-3 text-orange-700">
          <Inbox className="size-6" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">{title}</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
