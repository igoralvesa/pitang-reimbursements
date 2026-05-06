import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { Role } from '../../src/types/roles-enum';
import { app } from '../helpers/app';
import { authHeader } from '../helpers/auth';
import { disconnectDatabase, prepareDatabase } from '../helpers/database';

describe('GET /users', () => {
  beforeEach(async () => {
    await prepareDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('when user is authenticated as ADMIN', () => {
    it('lists users without returning password hashes', async () => {
      const response = await request(app)
        .get('/users')
        .set('Authorization', await authHeader(Role.ADMIN));

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].password).toBeUndefined();
      expect(response.body[0].passwordHash).toBeUndefined();
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
