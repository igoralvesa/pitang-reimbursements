import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { prisma } from '../../src/core/prisma';
import { Role } from '../../src/types/roles-enum';
import { app } from '../helpers/app';
import { authHeader } from '../helpers/auth';
import { disconnectDatabase, prepareDatabase } from '../helpers/database';

describe('PUT /categories/:id', () => {
  beforeEach(async () => {
    await prepareDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('when user is authenticated as ADMIN', () => {
    it('updates a category', async () => {
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

    it('returns 404 when category does not exist', async () => {
      const response = await request(app)
        .put('/categories/00000000-0000-0000-0000-000000000000')
        .set('Authorization', await authHeader(Role.ADMIN))
        .send({ name: 'Meals' });

      expect(response.status).toBe(404);
    });
  });

  describe('authorization', () => {
    it('returns 401 without token', async () => {
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
    ] as const)('returns 403 with %s token', async (_label, role) => {
      const category = await prisma.category.create({
        data: { name: 'Transport' },
      });

      const response = await request(app)
        .put(`/categories/${category.id}`)
        .set('Authorization', await authHeader(role))
        .send({ name: 'Meals' });

      expect(response.status).toBe(403);
    });
  });
});
