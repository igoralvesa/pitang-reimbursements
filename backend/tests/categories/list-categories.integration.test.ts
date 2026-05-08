import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { prisma } from '../../src/core/prisma';
import { Role } from '../../src/types/roles-enum';
import { app } from '../helpers/app';
import { authHeader } from '../helpers/auth';
import { disconnectDatabase, prepareDatabase } from '../helpers/database';

describe('GET /categories', () => {
  beforeEach(async () => {
    await prepareDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('when user is authenticated', () => {
    it('returns a paginated response with only active categories', async () => {
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
      expect(response.body).toEqual({
        data: expect.arrayContaining([
          expect.objectContaining({ active: true, name: 'Meals' }),
        ]),
        meta: expect.objectContaining({
          limit: 10,
          page: 1,
          total: expect.any(Number),
          totalPages: expect.any(Number),
        }),
      });
      expect(response.body.data).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ active: false, name: 'Inactive' }),
        ]),
      );
    });

    it('filters categories by name using partial matching', async () => {
      await prisma.category.createMany({
        data: [
          { active: true, name: 'Hotel Backend Filter' },
          { active: true, name: 'Taxi Backend Filter' },
          { active: true, name: 'Unrelated Category' },
        ],
      });

      const response = await request(app)
        .get('/categories')
        .query({ name: 'backend filter' })
        .set('Authorization', await authHeader(Role.COLLABORATOR));

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([
        expect.objectContaining({ name: 'Hotel Backend Filter' }),
        expect.objectContaining({ name: 'Taxi Backend Filter' }),
      ]);
      expect(response.body.meta.total).toBe(2);
    });

    it('combines pagination and name filter', async () => {
      await prisma.category.createMany({
        data: [
          { active: true, name: 'Paged Category Alpha' },
          { active: true, name: 'Paged Category Beta' },
        ],
      });

      const response = await request(app)
        .get('/categories')
        .query({ limit: 1, name: 'Paged Category', page: 2 })
        .set('Authorization', await authHeader(Role.COLLABORATOR));

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([
        expect.objectContaining({ name: 'Paged Category Beta' }),
      ]);
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
    ])('rejects invalid %s query param', async (field, query) => {
      const response = await request(app)
        .get('/categories')
        .query(query)
        .set('Authorization', await authHeader(Role.COLLABORATOR));

      expect(response.status).toBe(400);
      expect(response.body[field]).toBeDefined();
    });
  });

  describe('authorization', () => {
    it('returns 401 without token', async () => {
      const response = await request(app).get('/categories');

      expect(response.status).toBe(401);
    });
  });
});
