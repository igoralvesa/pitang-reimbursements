import { zodResolver } from '@hookform/resolvers/zod';
import { Ban, Pencil, Plus, RotateCcw, Search, Tags } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Feedback } from '@/components/Feedback';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">Administração</p>
            <h1 className="mt-2 flex items-center gap-2 text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
              <Tags className="size-7 text-orange-700" />
              Gestão de categorias
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Cadastre e mantenha categorias de reembolso.
            </p>
          </div>
          <CategoryDialog
            mode="create"
            onSubmit={(values) => {
              createCategory(values);
              setFeedback('Categoria criada.');
            }}
          />
        </div>

        <Feedback message={feedback} />

        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por categoria"
                className="pl-9"
                aria-label="Buscar categorias"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger className="w-full bg-white lg:w-48 dark:bg-zinc-900" aria-label="Filtrar por status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas</SelectItem>
                <SelectItem value="ACTIVE">Ativas</SelectItem>
                <SelectItem value="INACTIVE">Inativas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
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
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon-sm"
                                  aria-label={`Reativar categoria ${category.name}`}
                                  onClick={() => {
                                    reactivateCategory(category.id);
                                    setFeedback(`${category.name} reativada.`);
                                  }}
                                >
                                  <RotateCcw className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Reativar</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <CategoryEmptyState onReset={resetFilters} />
          )}
        </div>
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

function CategoryEmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-14 text-center">
      <div className="rounded-full bg-orange-50 p-3 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
        <Tags className="size-7" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Nenhuma categoria encontrada</h2>
        <p className="mt-1 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
          Ajuste a busca ou os filtros para localizar uma categoria existente.
        </p>
      </div>
      <Button type="button" variant="outline" onClick={onReset}>
        Limpar filtros
      </Button>
    </div>
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  aria-label={`Editar categoria ${category?.name ?? ''}`}
                >
                  <Pencil className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar</TooltipContent>
            </Tooltip>
          </span>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Nova categoria' : 'Editar categoria'}</DialogTitle>
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
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              aria-label={`Inativar categoria ${category.name}`}
            >
              <Ban className="size-4" />
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent>Inativar</TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Inativar categoria?</AlertDialogTitle>
          <AlertDialogDescription>
            A categoria {category.name} ficará indisponível para novas solicitações.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction className="bg-red-600 text-white hover:bg-red-700" onClick={onConfirm}>
            Inativar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
