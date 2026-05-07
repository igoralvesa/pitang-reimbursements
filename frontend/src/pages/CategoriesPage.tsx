import { zodResolver } from '@hookform/resolvers/zod';
import { Ban, Pencil, Plus, RotateCcw, Tags } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ConfirmIconButton, TooltipIconButton } from '@/components/admin/AdminActions';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminFilters } from '@/components/admin/AdminFilters';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminTableCard } from '@/components/admin/AdminTableCard';
import { Feedback } from '@/components/Feedback';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useMockData } from '@/contexts/MockDataContext';
import { formatDateTime } from '@/lib/formatters';
import type { Category } from '@/types/domain';

const categorySchema = z.object({
  name: z.string().min(1, 'Informe o nome.'),
  active: z.coerce.boolean(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;
type CategoryFormInput = z.input<typeof categorySchema>;
type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

const statusFilterOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: 'Todas', value: 'ALL' },
  { label: 'Ativas', value: 'ACTIVE' },
  { label: 'Inativas', value: 'INACTIVE' },
];

export function CategoriesPage() {
  const { categories, createCategory, inactivateCategory, reactivateCategory, updateCategory } = useMockData();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const filteredCategories = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return categories.filter((category) => {
      const matchesSearch = category.name.toLowerCase().includes(normalizedSearch);
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && category.active) ||
        (statusFilter === 'INACTIVE' && !category.active);

      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
  };

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-6xl space-y-6">
        <AdminPageHeader
          icon={Tags}
          title="Gestão de categorias"
          description="Cadastre e mantenha categorias de reembolso."
          action={<CategoryDialog
            mode="create"
            onSubmit={(values) => {
              createCategory(values);
              setFeedback('Categoria criada.');
            }}
          />}
        />

        <Feedback message={feedback} />

        <AdminFilters
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por categoria"
          searchLabel="Buscar categorias"
          filterValue={statusFilter}
          onFilterChange={setStatusFilter}
          filterLabel="Filtrar por status"
          filterOptions={statusFilterOptions}
        />

        <AdminTableCard>
          {filteredCategories.length > 0 ? (
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
                  {filteredCategories.map((category) => (
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
                            onSubmit={(values) => {
                              updateCategory(category.id, values);
                              setFeedback(`${category.name} atualizada.`);
                            }}
                          />
                          {category.active ? (
                            <ConfirmCategoryInactivation
                              category={category}
                              onConfirm={() => {
                                inactivateCategory(category.id);
                                setFeedback(`${category.name} inativada.`);
                              }}
                            />
                          ) : (
                            <TooltipIconButton
                              icon={RotateCcw}
                              label={`Reativar categoria ${category.name}`}
                              onClick={() => {
                                reactivateCategory(category.id);
                                setFeedback(`${category.name} reativada.`);
                              }}
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <AdminEmptyState
              icon={Tags}
              title="Nenhuma categoria encontrada"
              description="Ajuste a busca ou os filtros para localizar uma categoria existente."
              onReset={resetFilters}
            />
          )}
        </AdminTableCard>
      </div>
    </TooltipProvider>
  );
}

function CategoryStatusBadge({ active }: { active: boolean }) {
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

function CategoryDialog({
  category,
  mode,
  onSubmit,
}: {
  category?: Category;
  mode: 'create' | 'edit';
  onSubmit: (values: CategoryFormValues) => void;
}) {
  const [open, setOpen] = useState(false);
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<CategoryFormInput, unknown, CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    values: {
      name: category?.name ?? '',
      active: category?.active ?? true,
    },
  });

  const submit = handleSubmit((values) => {
    onSubmit(values);
    reset({ name: '', active: true });
    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === 'create' ? (
          <Button type="button" className="bg-orange-600 hover:bg-orange-700">
            <Plus className="size-4" />
            Nova categoria
          </Button>
        ) : (
          <span>
            <TooltipIconButton icon={Pencil} label={`Editar categoria ${category?.name ?? ''}`} />
          </span>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Nova categoria' : 'Editar categoria'}</DialogTitle>
          <DialogDescription>
            Informe os dados da categoria usada nas solicitações de reembolso.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`category-name-${category?.id ?? 'new'}`}>Nome</Label>
            <Input id={`category-name-${category?.id ?? 'new'}`} {...register('name')} />
            {errors.name ? <p className="text-xs text-red-600">{errors.name.message}</p> : null}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('active')} />
            Ativa
          </label>
          <DialogFooter>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
