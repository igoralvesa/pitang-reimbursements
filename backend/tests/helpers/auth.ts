import request from 'supertest';

import { app } from '../../src/app';
import { defaultPassword } from '../../src/core/seed';

const roleEmails = {
  ADMIN: 'admin@email.com',
  COLLABORATOR: 'colaborador@email.com',
  FINANCE: 'financeiro@email.com',
  MANAGER: 'gestor@email.com',
} as const;

export async function loginAs(role: keyof typeof roleEmails) {
  const response = await request(app)
    .post('/auth/login')
    .send({
      email: roleEmails[role],
      password: defaultPassword,
    });

  return response.body.token as string;
}

export async function authHeader(role: keyof typeof roleEmails) {
  return `Bearer ${await loginAs(role)}`;
}
