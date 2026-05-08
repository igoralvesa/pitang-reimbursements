import { Ban, Tags } from 'lucide-react';
import { ConfirmIconButton } from '@/components/admin/AdminActions';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { CategoryDialog, type CategoryFormValues } from '@/components/Category/CategoryDialog';
import { CategoryStatusBadge } from '@/components/Category/CategoryStatusBadge';
import { TableState } from '@/components/TableState';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateTime } from '@/lib/date';
import type { Category, CreateCategoryPayload } from '@/types/api';

export function CategoryTable({
  categories,
  isLoading,
  isUpdating,
  onInactivate,
  onResetFilters,
  onUpdate,
}: {
  categories: Category[];
  isLoading: boolean;
  isUpdating: boolean;
  onInactivate: (category: Category) => Promise<void>;
  onResetFilters: () => void;
  onUpdate: (
    category: Category,
    values: CategoryFormValues,
    setFieldError: (name: keyof CreateCategoryPayload, message: string) => void,
  ) => Promise<void>;
}) {
  if (isLoading) {
    return (
      <TableState
        icon={Tags}
        title="Carregando categorias"
        description="Aguarde enquanto buscamos as categorias cadastradas."
      />
    );
  }

  if (categories.length === 0) {
    return (
      <AdminEmptyState
        icon={Tags}
        title="Nenhuma categoria encontrada"
        description="Ajuste a busca ou os filtros para localizar uma categoria existente."
        onReset={onResetFilters}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Categoria</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criada em</TableHead>
            <TableHead>Atualizada em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60">
              <TableCell className="font-medium">{category.name}</TableCell>
              <TableCell>
                <CategoryStatusBadge active={category.active} />
              </TableCell>
              <TableCell>{formatDateTime(category.createdAt)}</TableCell>
              <TableCell>{formatDateTime(category.updatedAt)}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-1.5">
                  <CategoryDialog
                    category={category}
                    mode="edit"
                    isSubmitting={isUpdating}
                    onSubmit={(values, setFieldError) => onUpdate(category, values, setFieldError)}
                  />
                  {category.active ? (
                    <ConfirmCategoryInactivation
                      category={category}
                      onConfirm={() => void onInactivate(category)}
                    />
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ConfirmCategoryInactivation({
  category,
  onConfirm,
}: {
  category: Category;
  onConfirm: () => void;
}) {
  return (
    <ConfirmIconButton
      icon={Ban}
      label={`Inativar categoria ${category.name}`}
      title="Inativar categoria?"
      description={`A categoria ${category.name} ficará indisponível para novas solicitações.`}
      confirmLabel="Inativar"
      onConfirm={onConfirm}
    />
  );
}
