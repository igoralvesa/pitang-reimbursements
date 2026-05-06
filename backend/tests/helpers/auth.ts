import request from 'supertest';

import { defaultPassword } from '../../src/core/seed';
import { Role } from '../../src/types/roles-enum';
import { app } from './app';

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

export async function loginAsAdmin() {
  return loginAs(Role.ADMIN);
}

export async function loginAsEmployee() {
  return loginAs(Role.COLLABORATOR);
}

export async function loginAsManager() {
  return loginAs(Role.MANAGER);
}

export async function loginAsFinance() {
  return loginAs(Role.FINANCE);
}

export async function getAuthHeader(token: string) {
  return `Bearer ${token}`;
}

export async function authHeader(role: Role) {
  return `Bearer ${await loginAs(role)}`;
}
