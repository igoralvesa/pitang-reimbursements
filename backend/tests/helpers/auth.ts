import request from 'supertest';

import { app } from '../../src/app';
import { defaultPassword } from '../../src/core/seed';
import { Role } from '../../src/types/roles-enum';

const roleEmails: Record<Role, string> = {
  [Role.ADMIN]: 'admin@email.com',
  [Role.COLLABORATOR]: 'colaborador@email.com',
  [Role.FINANCE]: 'financeiro@email.com',
  [Role.MANAGER]: 'gestor@email.com',
};

export async function loginAs(role: Role) {
  const response = await request(app)
    .post('/auth/login')
    .send({
      email: roleEmails[role],
      password: defaultPassword,
    });

  return response.body.token as string;
}

export async function authHeader(role: Role) {
  return `Bearer ${await loginAs(role)}`;
}
