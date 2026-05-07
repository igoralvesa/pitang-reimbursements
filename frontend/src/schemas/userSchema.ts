import { z } from 'zod';

const roleSchema = z.enum(['COLLABORATOR', 'MANAGER', 'FINANCE', 'ADMIN'], {
  error: 'Perfil inválido',
});

const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres')
  .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
  .regex(/[^A-Za-z0-9]/, 'A senha deve conter pelo menos um caractere especial');

export const createUserSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório'),
  email: z
    .string()
    .trim()
    .min(1, 'E-mail é obrigatório')
    .email('Informe um e-mail válido')
    .toLowerCase(),
  password: passwordSchema,
  role: roleSchema,
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1, 'Nome é obrigatório').optional(),
    email: z
      .string()
      .trim()
      .email('Informe um e-mail válido')
      .toLowerCase()
      .optional(),
    password: passwordSchema.optional(),
  })
  .refine((values) => Object.values(values).some((value) => value !== undefined), {
    message: 'Informe pelo menos um campo para atualizar',
  });

export const promoteUserSchema = z.object({
  role: roleSchema,
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
export type PromoteUserFormData = z.infer<typeof promoteUserSchema>;
