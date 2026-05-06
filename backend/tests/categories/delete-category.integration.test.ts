import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { prisma } from '../../src/core/prisma';
import { Role } from '../../src/types/roles-enum';
import { app } from '../helpers/app';
import { authHeader } from '../helpers/auth';
import { disconnectDatabase, prepareDatabase } from '../helpers/database';

describe('DELETE /categories/:id', () => {
  beforeEach(async () => {
    await prepareDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('when user is authenticated as ADMIN', () => {
    it('inactivates a category', async () => {
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

    it('returns 404 when category does not exist', async () => {
      const response = await request(app)
        .delete('/categories/00000000-0000-0000-0000-000000000000')
        .set('Authorization', await authHeader(Role.ADMIN));

      expect(response.status).toBe(404);
    });
  });

  describe('authorization', () => {
    it('returns 401 without token', async () => {
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
    ] as const)('returns 403 with %s token', async (_label, role) => {
      const category = await prisma.category.create({
        data: { name: 'Transport' },
      });

      const response = await request(app)
        .delete(`/categories/${category.id}`)
        .set('Authorization', await authHeader(role));

      expect(response.status).toBe(403);
    });
  });
});
