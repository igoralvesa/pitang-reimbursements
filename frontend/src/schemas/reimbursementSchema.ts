import { z } from 'zod';

const amountSchema = z.coerce.number({
  error: 'Valor é obrigatório',
}).positive('Valor deve ser maior que zero');

const categoryIdSchema = z.uuid('Categoria inválida');

const descriptionSchema = z.string().trim().min(1, 'Descrição é obrigatória');

const expenseDateSchema = z
  .string()
  .trim()
  .min(1, 'Data da despesa é obrigatória')
  .refine((value) => !Number.isNaN(new Date(value).getTime()), {
    message: 'Data da despesa inválida',
  });

export const createReimbursementSchema = z.object({
  categoryId: categoryIdSchema,
  description: descriptionSchema,
  amount: amountSchema,
  expenseDate: expenseDateSchema,
});

export const updateReimbursementSchema = z
  .object({
    categoryId: categoryIdSchema.optional(),
    description: descriptionSchema.optional(),
    amount: amountSchema.optional(),
    expenseDate: expenseDateSchema.optional(),
  })
  .refine((values) => Object.values(values).some((value) => value !== undefined), {
    message: 'Informe pelo menos um campo para atualizar',
  });

export type CreateReimbursementFormData = z.infer<typeof createReimbursementSchema>;
export type UpdateReimbursementFormData = z.infer<typeof updateReimbursementSchema>;
