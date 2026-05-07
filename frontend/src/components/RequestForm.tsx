import { zodResolver } from '@hookform/resolvers/zod';
import { Paperclip, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Category, RequestFormValues } from '@/types/domain';

const requestSchema = z.object({
  categoryId: z.string().min(1, 'Informe a categoria.'),
  description: z.string().min(1, 'Informe a descrição.'),
  amount: z.coerce.number().positive('O valor deve ser maior que zero.'),
  expenseDate: z.string().min(1, 'Informe a data da despesa.'),
});

type RequestFormInput = z.input<typeof requestSchema>;

export function RequestForm({
  categories,
  defaultValues,
  onSubmit,
  submitLabel,
}: {
  categories: Category[];
  defaultValues?: RequestFormValues;
  onSubmit: (values: RequestFormValues) => void;
  submitLabel: string;
}) {
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<RequestFormInput, unknown, RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: defaultValues ?? {
      categoryId: '',
      description: '',
      amount: 0,
      expenseDate: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="categoryId">Categoria</Label>
          <select
            id="categoryId"
            className="h-9 w-full rounded-lg border border-input bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-zinc-900"
            {...register('categoryId')}
          >
            <option value="">Selecione uma categoria</option>
            {categories
              .filter((category) => category.active)
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </select>
          {errors.categoryId ? <p className="text-xs text-red-600">{errors.categoryId.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Valor</Label>
          <Input id="amount" type="number" step="0.01" min="0" {...register('amount')} />
          {errors.amount ? <p className="text-xs text-red-600">{errors.amount.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="expenseDate">Data da despesa</Label>
          <Input id="expenseDate" type="date" {...register('expenseDate')} />
          {errors.expenseDate ? <p className="text-xs text-red-600">{errors.expenseDate.message}</p> : null}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          rows={5}
          placeholder="Descreva o motivo corporativo deste reembolso."
          {...register('description')}
        />
        {errors.description ? <p className="text-xs text-red-600">{errors.description.message}</p> : null}
      </div>
      <div className="rounded-lg border border-dashed border-orange-200 bg-orange-50/60 p-4">
        <Label htmlFor="attachment-ui" className="flex items-center gap-2">
          <Paperclip className="size-4 text-orange-700" />
          Anexo opcional
        </Label>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Tipos aceitos: PDF, JPG e PNG. O envio é apenas visual.</p>
        <Input id="attachment-ui" type="file" accept=".pdf,.jpg,.jpeg,.png" className="mt-3 bg-white" />
      </div>
      <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
        <Save className="size-4" />
        {submitLabel}
      </Button>
    </form>
  );
}
