import { Button } from '@/components/ui/button';
import type { PaginationMeta } from '@/types/api';

export function ReimbursementPagination({
  isLoadingMore,
  meta,
  onLoadMore,
}: {
  isLoadingMore: boolean;
  meta: PaginationMeta;
  onLoadMore: () => void;
}) {
  const visibleTotalPages = Math.max(meta.totalPages, 1);
  const canLoadMore = meta.page < meta.totalPages;

  return (
    <div className='flex flex-col gap-3 border-t px-4 py-3 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800 dark:text-zinc-300'>
      <span>
        Página {meta.page} de {visibleTotalPages} · {meta.total} registro
        {meta.total === 1 ? '' : 's'}
      </span>
      <Button
        type='button'
        variant='outline'
        size='sm'
        disabled={!canLoadMore || isLoadingMore}
        onClick={onLoadMore}
      >
        {isLoadingMore ? 'Carregando...' : 'Carregar mais'}
      </Button>
    </div>
  );
}
