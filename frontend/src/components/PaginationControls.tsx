import { Button } from '@/components/ui/button';
import type { PaginationMeta } from '@/types/api';

export function PaginationControls({
  meta,
  onPageChange,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}) {
  const visibleTotalPages = Math.max(meta.totalPages, 1);

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:text-zinc-300">
      <span>
        Página {meta.page} de {visibleTotalPages} · {meta.total} registro{meta.total === 1 ? '' : 's'}
      </span>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={meta.page <= 1}
          onClick={() => onPageChange(meta.page - 1)}
        >
          Anterior
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}
