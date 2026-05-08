import type { CreateUserPayload, PromoteUserPayload, Role, UpdateUserPayload } from '@/types/api';

export const roles = ['COLLABORATOR', 'MANAGER', 'FINANCE', 'ADMIN'] as const satisfies readonly Role[];

export type UserFormValues = Omit<CreateUserPayload, 'role'> & {
  role: Role;
};

export type UserEditFormValues = UpdateUserPayload;

export type RoleFormValues = PromoteUserPayload;
