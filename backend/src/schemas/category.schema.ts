import z from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório'),
});

export const updateCategorySchema = createCategorySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Pelo menos um campo deve ser informado',
  });

export const getCategoriesQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int('Limite deve ser um número inteiro')
    .positive('Limite deve ser maior que zero')
    .max(100, 'Limite deve ser no máximo 100')
    .default(10),
  name: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
  page: z.coerce
    .number()
    .int('Página deve ser um número inteiro')
    .positive('Página deve ser maior que zero')
    .default(1),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type GetCategoriesQueryInput = z.infer<typeof getCategoriesQuerySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
