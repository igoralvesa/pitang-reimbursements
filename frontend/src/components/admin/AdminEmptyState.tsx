import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';

export function AdminEmptyState({
  description,
  icon: Icon,
  onReset,
  title,
}: {
  description: string;
  icon: LucideIcon;
  onReset: () => void;
  title: string;
}) {
  return (
    <CardContent className="flex flex-col items-center gap-4 px-4 py-14 text-center">
      <div className="rounded-full bg-orange-50 p-3 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
        <Icon className="size-7" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">{title}</h2>
        <p className="mt-1 max-w-md text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
      <Button type="button" variant="outline" onClick={onReset}>
        Limpar filtros
      </Button>
    </CardContent>
  );
}
