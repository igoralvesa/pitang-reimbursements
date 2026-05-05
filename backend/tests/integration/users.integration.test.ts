import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import bcrypt from 'bcryptjs';
import request from 'supertest';

import { app } from '../../src/app';
import { prisma } from '../../src/core/prisma';
import { authHeader } from '../helpers/auth';
import {
  createUserFixture,
  disconnectDatabase,
  prepareDatabase,
} from '../helpers/test-db';

const validCreateUserBody = {
  email: 'new.user@email.com',
  name: 'Novo Usuário',
  password: 'Senha@123',
  role: 'MANAGER',
};

describe('Users endpoints', () => {
  beforeEach(async () => {
    await prepareDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('POST /auth/login', () => {
    it('allows public login', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'admin@email.com', password: 'Senha@123' });

      expect(response.status).toBe(200);
      expect(response.body.token).toEqual(expect.any(String));
    });
  });

  describe('POST /users', () => {
    it('creates user successfully as ADMIN', async () => {
      const response = await request(app)
        .post('/users')
        .set('Authorization', await authHeader('ADMIN'))
        .send(validCreateUserBody);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        email: 'new.user@email.com',
        name: 'Novo Usuário',
        role: 'MANAGER',
      });
      expect(response.body.password).toBeUndefined();
      expect(response.body.passwordHash).toBeUndefined();
    });

    it('defaults created user role to COLLABORATOR when role is not sent', async () => {
      const response = await request(app)
        .post('/users')
        .set('Authorization', await authHeader('ADMIN'))
        .send({
          email: 'default.role@email.com',
          name: 'Usuário Sem Perfil',
          password: 'Senha@123',
        });

      expect(response.status).toBe(201);
      expect(response.body.role).toBe('COLLABORATOR');
    });

    it('rejects user creation without token with 401', async () => {
      const response = await request(app)
        .post('/users')
        .send(validCreateUserBody);

      expect(response.status).toBe(401);
    });

    it.each([
      ['COLABORADOR', 'COLLABORATOR'],
      ['GESTOR', 'MANAGER'],
      ['FINANCEIRO', 'FINANCE'],
    ] as const)(
      'rejects user creation with %s token with 403',
      async (_label, role) => {
        const response = await request(app)
          .post('/users')
          .set('Authorization', await authHeader(role))
          .send(validCreateUserBody);

        expect(response.status).toBe(403);
      },
    );

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
    ])('validates create user body: %s', async (_case, body, field) => {
      const response = await request(app)
        .post('/users')
        .set('Authorization', await authHeader('ADMIN'))
        .send(body);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(field);
    });

    it('rejects duplicated email', async () => {
      const response = await request(app)
        .post('/users')
        .set('Authorization', await authHeader('ADMIN'))
        .send({
          ...validCreateUserBody,
          email: 'admin@email.com',
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Usuário já cadastrado');
    });

    it('does not store password as plain text', async () => {
      await request(app)
        .post('/users')
        .set('Authorization', await authHeader('ADMIN'))
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
  });

  describe('GET /users', () => {
    it('lists users successfully as ADMIN without returning password hashes', async () => {
      const response = await request(app)
        .get('/users')
        .set('Authorization', await authHeader('ADMIN'));

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].password).toBeUndefined();
      expect(response.body[0].passwordHash).toBeUndefined();
    });

    it('rejects list users without token with 401', async () => {
      const response = await request(app).get('/users');

      expect(response.status).toBe(401);
    });

    it.each([
      ['COLABORADOR', 'COLLABORATOR'],
      ['GESTOR', 'MANAGER'],
      ['FINANCEIRO', 'FINANCE'],
    ] as const)(
      'rejects list users with %s token with 403',
      async (_label, role) => {
        const response = await request(app)
          .get('/users')
          .set('Authorization', await authHeader(role));

        expect(response.status).toBe(403);
      },
    );
  });

  describe('GET /users/:id', () => {
    it('gets a user by id as ADMIN', async () => {
      const user = await createUserFixture({ email: 'get.user@email.com' });

      const response = await request(app)
        .get(`/users/${user.id}`)
        .set('Authorization', await authHeader('ADMIN'));

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        email: user.email,
        id: user.id,
      });
      expect(response.body.passwordHash).toBeUndefined();
    });

    it('returns 404 when getting nonexistent user', async () => {
      const response = await request(app)
        .get('/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', await authHeader('ADMIN'));

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /users/:id', () => {
    it('updates a user as ADMIN', async () => {
      const user = await createUserFixture({ email: 'update.user@email.com' });

      const response = await request(app)
        .patch(`/users/${user.id}`)
        .set('Authorization', await authHeader('ADMIN'))
        .send({ name: 'Usuário Atualizado' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Usuário Atualizado');
      expect(response.body.passwordHash).toBeUndefined();
    });
  });

  describe('POST /users/:id/promote', () => {
    it('promotes a user as ADMIN', async () => {
      const user = await createUserFixture({ email: 'promote.user@email.com' });

      const response = await request(app)
        .post(`/users/${user.id}/promote`)
        .set('Authorization', await authHeader('ADMIN'))
        .send({ role: 'FINANCE' });

      expect(response.status).toBe(200);
      expect(response.body.role).toBe('FINANCE');
    });
  });

  describe('DELETE /users/:id', () => {
    it('deletes a user as ADMIN', async () => {
      const user = await createUserFixture({ email: 'delete.user@email.com' });

      const response = await request(app)
        .delete(`/users/${user.id}`)
        .set('Authorization', await authHeader('ADMIN'));

      expect(response.status).toBe(204);

      const deletedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(deletedUser).toBeNull();
    });
  });
});
