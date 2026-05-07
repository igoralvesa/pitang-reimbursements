import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Nome da categoria é obrigatório'),
});

export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(1, 'Nome da categoria é obrigatório').optional(),
  })
  .refine((values) => Object.values(values).some((value) => value !== undefined), {
    message: 'Informe pelo menos um campo para atualizar',
  });

export type CreateCategoryFormData = z.infer<typeof createCategorySchema>;
export type UpdateCategoryFormData = z.infer<typeof updateCategorySchema>;
