import { describe, expect, it } from '@jest/globals';

import {
  createUserSchema,
  promoteUserSchema,
  updateUserSchema,
} from '../../src/schemas/user.schema';

const validUserBody = {
  email: 'user@email.com',
  name: 'User Test',
  password: 'Senha@123',
};

describe('user schemas', () => {
  it('allows creating a user without role', () => {
    const result = createUserSchema.safeParse(validUserBody);

    expect(result.success).toBe(true);
  });

  it('allows creating a user with role', () => {
    const result = createUserSchema.safeParse({
      ...validUserBody,
      role: 'MANAGER',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.role).toBe('MANAGER');
    }
  });

  it('does not allow role-only regular user updates', () => {
    const result = updateUserSchema.safeParse({ role: 'MANAGER' });

    expect(result.success).toBe(false);
  });

  it('validates user promotion payload', () => {
    const result = promoteUserSchema.safeParse({ role: 'FINANCE' });

    expect(result.success).toBe(true);
  });
});
