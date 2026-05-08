import z from 'zod';

import { Role } from '@/types/roles-enum';

export const userRoleSchema = z.enum(Role);

const userBaseSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório'),
  email: z.email('Endereço de e-mail inválido').toLowerCase(),
  password: z
    .string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres')
    .regex(/[a-z]/, 'A senha deve ter pelo menos uma letra minúscula')
    .regex(/[A-Z]/, 'A senha deve ter pelo menos uma letra maiúscula')
    .regex(/[^A-Za-z0-9]/, 'A senha deve ter pelo menos um caractere especial'),
});

export const createUserSchema = userBaseSchema.extend({
  role: userRoleSchema.optional(),
});

export const updateUserSchema = userBaseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Pelo menos um campo deve ser informado',
  });

export const promoteUserSchema = z.object({
  role: userRoleSchema,
});

export const getUsersQuerySchema = z.object({
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
  role: userRoleSchema.optional(),
});

export const userSchema = createUserSchema;

export type UserRoleInput = z.infer<typeof userRoleSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type GetUsersQueryInput = z.infer<typeof getUsersQuerySchema>;
export type PromoteUserInput = z.infer<typeof promoteUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
