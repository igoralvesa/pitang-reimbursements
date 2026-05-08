import { Badge } from '@/components/ui/badge';

export function CategoryStatusBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
      Ativa
    </Badge>
  ) : (
    <Badge variant="outline" className="border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
      Inativa
    </Badge>
  );
}
