import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { Role } from '../../src/types/roles-enum';
import { app } from '../helpers/app';
import { authHeader } from '../helpers/auth';
import { disconnectDatabase, prepareDatabase } from '../helpers/database';
import { createUserFixture } from '../helpers/factories';

describe('GET /users', () => {
  beforeEach(async () => {
    await prepareDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('when user is authenticated as ADMIN', () => {
    it('returns a paginated users response without password hashes', async () => {
      const response = await request(app)
        .get('/users')
        .set('Authorization', await authHeader(Role.ADMIN));

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        data: expect.any(Array),
        meta: expect.objectContaining({
          limit: 10,
          page: 1,
          total: expect.any(Number),
          totalPages: expect.any(Number),
        }),
      });
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].password).toBeUndefined();
      expect(response.body.data[0].passwordHash).toBeUndefined();
    });

    it('filters users by name using partial matching', async () => {
      await createUserFixture({
        email: 'ana.pagination@example.com',
        name: 'Ana Backend Filter',
        role: Role.COLLABORATOR,
      });
      await createUserFixture({
        email: 'bruno.pagination@example.com',
        name: 'Bruno Backend Filter',
        role: Role.COLLABORATOR,
      });

      const response = await request(app)
        .get('/users')
        .query({ name: 'backend filter' })
        .set('Authorization', await authHeader(Role.ADMIN));

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([
        expect.objectContaining({ name: 'Ana Backend Filter' }),
        expect.objectContaining({ name: 'Bruno Backend Filter' }),
      ]);
      expect(response.body.meta.total).toBe(2);
    });

    it('filters users by role', async () => {
      await createUserFixture({
        email: 'finance.pagination@example.com',
        name: 'Finance Pagination',
        role: Role.FINANCE,
      });

      const response = await request(app)
        .get('/users')
        .query({ role: Role.FINANCE })
        .set('Authorization', await authHeader(Role.ADMIN));

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ role: Role.FINANCE }),
        ]),
      );
      expect(response.body.data.every((user: { role: Role }) => user.role === Role.FINANCE)).toBe(true);
    });

    it('combines pagination and filters', async () => {
      await createUserFixture({
        email: 'manager-alpha@example.com',
        name: 'Manager Backend Alpha',
        role: Role.MANAGER,
      });
      await createUserFixture({
        email: 'manager-beta@example.com',
        name: 'Manager Backend Beta',
        role: Role.MANAGER,
      });

      const response = await request(app)
        .get('/users')
        .query({
          limit: 1,
          name: 'Manager Backend',
          page: 2,
          role: Role.MANAGER,
        })
        .set('Authorization', await authHeader(Role.ADMIN));

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toEqual(
        expect.objectContaining({
          name: 'Manager Backend Beta',
          role: Role.MANAGER,
        }),
      );
      expect(response.body.meta).toEqual({
        limit: 1,
        page: 2,
        total: 2,
        totalPages: 2,
      });
    });

    it.each([
      ['page', { page: 0 }],
      ['limit', { limit: 0 }],
      ['limit', { limit: 101 }],
      ['role', { role: 'INVALID' }],
    ])('rejects invalid %s query param', async (field, query) => {
      const response = await request(app)
        .get('/users')
        .query(query)
        .set('Authorization', await authHeader(Role.ADMIN));

      expect(response.status).toBe(400);
      expect(response.body[field]).toBeDefined();
    });
  });

  describe('authorization', () => {
    it('returns 401 without token', async () => {
      const response = await request(app).get('/users');

      expect(response.status).toBe(401);
    });

    it.each([
      ['COLABORADOR', Role.COLLABORATOR],
      ['GESTOR', Role.MANAGER],
      ['FINANCEIRO', Role.FINANCE],
    ] as const)('returns 403 with %s token', async (_label, role) => {
      const response = await request(app)
        .get('/users')
        .set('Authorization', await authHeader(role));

      expect(response.status).toBe(403);
    });
  });
});
