import z from 'zod';

export const createReimbursementSchema = z.object({
  amount: z.coerce.number().positive('Valor deve ser maior que zero'),
  categoryId: z.uuid('Categoria inválida'),
  description: z.string().trim().min(1, 'Descrição é obrigatória'),
  expenseDate: z.string().min(1, 'Data da despesa é obrigatória').pipe(
    z.coerce.date({
      error: 'Data da despesa inválida',
    }),
  ),
});

export const updateReimbursementSchema = createReimbursementSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Pelo menos um campo deve ser informado',
  });

export const reimbursementParamsSchema = z.object({
  id: z.uuid('Identificador da solicitação inválido'),
});

export const rejectReimbursementSchema = z.object({
  rejectionReason: z.string().trim().min(1, 'Justificativa é obrigatória'),
});

export type CreateReimbursementInput = z.infer<
  typeof createReimbursementSchema
>;
export type UpdateReimbursementInput = z.infer<
  typeof updateReimbursementSchema
>;
export type ReimbursementParamsInput = z.infer<
  typeof reimbursementParamsSchema
>;
export type RejectReimbursementInput = z.infer<
  typeof rejectReimbursementSchema
>;
