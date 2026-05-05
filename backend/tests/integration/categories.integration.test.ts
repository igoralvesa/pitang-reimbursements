import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { app } from '../../src/app';
import { prisma } from '../../src/core/prisma';
import { Role } from '../../src/types/roles-enum';
import { authHeader } from '../helpers/auth';
import { disconnectDatabase, prepareDatabase } from '../helpers/test-db';

describe('Categories endpoints', () => {
  beforeEach(async () => {
    await prepareDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('GET /categories', () => {
    it('lists categories successfully when authenticated', async () => {
      await prisma.category.createMany({
        data: [
          { active: true, name: 'Meals' },
          { active: false, name: 'Inactive' },
        ],
      });

      const response = await request(app)
        .get('/categories')
        .set('Authorization', await authHeader(Role.COLLABORATOR));

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        expect.objectContaining({ active: true, name: 'Meals' }),
      ]);
    });

    it('rejects list categories without token with 401', async () => {
      const response = await request(app).get('/categories');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /categories', () => {
    it('creates category successfully as ADMIN', async () => {
      const response = await request(app)
        .post('/categories')
        .set('Authorization', await authHeader(Role.ADMIN))
        .send({ name: 'Transport' });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        active: true,
        name: 'Transport',
      });
    });

    it('rejects category creation without token with 401', async () => {
      const response = await request(app)
        .post('/categories')
        .send({ name: 'Transport' });

      expect(response.status).toBe(401);
    });

    it.each([
      ['COLABORADOR', Role.COLLABORATOR],
      ['GESTOR', Role.MANAGER],
      ['FINANCEIRO', Role.FINANCE],
    ] as const)(
      'rejects category creation with %s token with 403',
      async (_label, role) => {
        const response = await request(app)
          .post('/categories')
          .set('Authorization', await authHeader(role))
          .send({ name: 'Transport' });

        expect(response.status).toBe(403);
      },
    );

    it.each([
      ['name required', {}],
      ['name cannot be empty', { name: '' }],
    ])('validates category body: %s', async (_case, body) => {
      const response = await request(app)
        .post('/categories')
        .set('Authorization', await authHeader(Role.ADMIN))
        .send(body);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('name');
    });
  });

  describe('PUT /categories/:id', () => {
    it('updates category successfully as ADMIN', async () => {
      const category = await prisma.category.create({
        data: { name: 'Transport' },
      });

      const response = await request(app)
        .put(`/categories/${category.id}`)
        .set('Authorization', await authHeader(Role.ADMIN))
        .send({ name: 'Meals' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Meals');
    });

    it('rejects category update without token with 401', async () => {
      const category = await prisma.category.create({
        data: { name: 'Transport' },
      });

      const response = await request(app)
        .put(`/categories/${category.id}`)
        .send({ name: 'Meals' });

      expect(response.status).toBe(401);
    });

    it.each([
      ['COLABORADOR', Role.COLLABORATOR],
      ['GESTOR', Role.MANAGER],
      ['FINANCEIRO', Role.FINANCE],
    ] as const)(
      'rejects category update with %s token with 403',
      async (_label, role) => {
        const category = await prisma.category.create({
          data: { name: 'Transport' },
        });

        const response = await request(app)
          .put(`/categories/${category.id}`)
          .set('Authorization', await authHeader(role))
          .send({ name: 'Meals' });

        expect(response.status).toBe(403);
      },
    );

    it('rejects category update for nonexistent category with 404', async () => {
      const response = await request(app)
        .put('/categories/00000000-0000-0000-0000-000000000000')
        .set('Authorization', await authHeader(Role.ADMIN))
        .send({ name: 'Meals' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /categories/:id', () => {
    it('inactivates category successfully as ADMIN', async () => {
      const category = await prisma.category.create({
        data: { name: 'Transport' },
      });

      const response = await request(app)
        .delete(`/categories/${category.id}`)
        .set('Authorization', await authHeader(Role.ADMIN));

      expect(response.status).toBe(204);

      const inactiveCategory = await prisma.category.findUnique({
        where: { id: category.id },
      });
      expect(inactiveCategory?.active).toBe(false);
    });

    it('rejects category delete without token with 401', async () => {
      const category = await prisma.category.create({
        data: { name: 'Transport' },
      });

      const response = await request(app).delete(`/categories/${category.id}`);

      expect(response.status).toBe(401);
    });

    it.each([
      ['COLABORADOR', Role.COLLABORATOR],
      ['GESTOR', Role.MANAGER],
      ['FINANCEIRO', Role.FINANCE],
    ] as const)(
      'rejects category delete with %s token with 403',
      async (_label, role) => {
        const category = await prisma.category.create({
          data: { name: 'Transport' },
        });

        const response = await request(app)
          .delete(`/categories/${category.id}`)
          .set('Authorization', await authHeader(role));

        expect(response.status).toBe(403);
      },
    );

    it('returns 404 when deleting nonexistent category', async () => {
      const response = await request(app)
        .delete('/categories/00000000-0000-0000-0000-000000000000')
        .set('Authorization', await authHeader(Role.ADMIN));

      expect(response.status).toBe(404);
    });

    it.todo(
      'prevents inactive categories from being used in reimbursement creation when reimbursement endpoints exist',
    );
  });
});
