import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { TooltipIconButton } from '@/components/admin/AdminActions';
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
import { createCategorySchema, updateCategorySchema } from '@/schemas/categorySchema';
import type { Category, CreateCategoryPayload, UpdateCategoryPayload } from '@/types/api';

export type CategoryFormValues = CreateCategoryPayload | UpdateCategoryPayload;

export function CategoryDialog({
  category,
  isSubmitting,
  mode,
  onSubmit,
}: {
  category?: Category;
  isSubmitting?: boolean;
  mode: 'create' | 'edit';
  onSubmit: (
    values: CategoryFormValues,
    setFieldError: (name: keyof CreateCategoryPayload, message: string) => void,
  ) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(mode === 'create' ? createCategorySchema : updateCategorySchema),
    values: {
      name: category?.name ?? '',
    },
  });

  const submit = handleSubmit(async (values) => {
    await onSubmit(values, (name, message) => {
      setError(name, { message, type: 'server' });
    });
    reset({ name: '' });
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
          <DialogFooter>
            <Button type="submit" className="bg-orange-600 hover:bg-orange-700" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
