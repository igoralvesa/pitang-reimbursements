import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import bcrypt from 'bcryptjs';
import request from 'supertest';

import { prisma } from '../../src/core/prisma';
import { Role } from '../../src/types/roles-enum';
import { app } from '../helpers/app';
import { authHeader } from '../helpers/auth';
import { disconnectDatabase, prepareDatabase } from '../helpers/database';

const validCreateUserBody = {
  email: 'new.user@email.com',
  name: 'Novo Usuário',
  password: 'Senha@123',
  role: Role.MANAGER,
};

describe('POST /users', () => {
  beforeEach(async () => {
    await prepareDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('when user is authenticated as ADMIN', () => {
    it('creates a user', async () => {
      const response = await request(app)
        .post('/users')
        .set('Authorization', await authHeader(Role.ADMIN))
        .send(validCreateUserBody);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        email: 'new.user@email.com',
        name: 'Novo Usuário',
        role: Role.MANAGER,
      });
      expect(response.body.password).toBeUndefined();
      expect(response.body.passwordHash).toBeUndefined();
    });

    it('defaults created user role to COLLABORATOR when role is not sent', async () => {
      const response = await request(app)
        .post('/users')
        .set('Authorization', await authHeader(Role.ADMIN))
        .send({
          email: 'default.role@email.com',
          name: 'Usuário Sem Perfil',
          password: 'Senha@123',
        });

      expect(response.status).toBe(201);
      expect(response.body.role).toBe(Role.COLLABORATOR);
    });

    it('does not store password as plain text', async () => {
      await request(app)
        .post('/users')
        .set('Authorization', await authHeader(Role.ADMIN))
        .send(validCreateUserBody);

      const user = await prisma.user.findUnique({
        where: { email: validCreateUserBody.email },
      });

      expect(user?.passwordHash).toBeDefined();
      expect(user?.passwordHash).not.toBe(validCreateUserBody.password);
      expect(
        bcrypt.compareSync(
          validCreateUserBody.password,
          user?.passwordHash ?? '',
        ),
      ).toBe(true);
    });

    it('returns 409 for duplicated email', async () => {
      const response = await request(app)
        .post('/users')
        .set('Authorization', await authHeader(Role.ADMIN))
        .send({
          ...validCreateUserBody,
          email: 'admin@email.com',
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Usuário já cadastrado');
    });
  });

  describe('validation', () => {
    it.each([
      ['name required', { ...validCreateUserBody, name: undefined }, 'name'],
      ['email required', { ...validCreateUserBody, email: undefined }, 'email'],
      [
        'email invalid format',
        { ...validCreateUserBody, email: 'invalid-email' },
        'email',
      ],
      [
        'password required',
        { ...validCreateUserBody, password: undefined },
        'password',
      ],
      ['role invalid', { ...validCreateUserBody, role: 'INVALID' }, 'role'],
    ])('returns 400 when %s', async (_case, body, field) => {
      const response = await request(app)
        .post('/users')
        .set('Authorization', await authHeader(Role.ADMIN))
        .send(body);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(field);
    });
  });

  describe('authorization', () => {
    it('returns 401 without token', async () => {
      const response = await request(app)
        .post('/users')
        .send(validCreateUserBody);

      expect(response.status).toBe(401);
    });

    it.each([
      ['COLABORADOR', Role.COLLABORATOR],
      ['GESTOR', Role.MANAGER],
      ['FINANCEIRO', Role.FINANCE],
    ] as const)('returns 403 with %s token', async (_label, role) => {
      const response = await request(app)
        .post('/users')
        .set('Authorization', await authHeader(role))
        .send(validCreateUserBody);

      expect(response.status).toBe(403);
    });
  });
});
