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
    it('lists only active categories', async () => {
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
  });

  describe('authorization', () => {
    it('returns 401 without token', async () => {
      const response = await request(app).get('/categories');

      expect(response.status).toBe(401);
    });
  });
});
