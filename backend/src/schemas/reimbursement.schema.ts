import z from 'zod';

import { ReimbursementStatus } from '../../generated/prisma/client';

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

export const getReimbursementsQuerySchema = z.object({
  categoryId: z.uuid('Categoria inválida').optional(),
  collaboratorId: z.uuid('Colaborador inválido').optional(),
  limit: z.coerce
    .number()
    .int('Limite deve ser um número inteiro')
    .positive('Limite deve ser maior que zero')
    .max(100, 'Limite deve ser no máximo 100')
    .default(10),
  page: z.coerce
    .number()
    .int('Página deve ser um número inteiro')
    .positive('Página deve ser maior que zero')
    .default(1),
  sortBy: z.enum(['createdAt', 'expenseDate', 'amount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.enum(ReimbursementStatus).optional(),
});

export type CreateReimbursementInput = z.infer<
  typeof createReimbursementSchema
>;
export type GetReimbursementsQueryInput = z.infer<
  typeof getReimbursementsQuerySchema
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
