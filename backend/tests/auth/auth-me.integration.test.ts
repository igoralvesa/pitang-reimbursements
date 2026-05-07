import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { Role } from '../../src/types/roles-enum';
import { app } from '../helpers/app';
import { authHeader } from '../helpers/auth';
import { disconnectDatabase, prepareDatabase } from '../helpers/database';
import { getSeedUser } from '../helpers/factories';

describe('GET /auth/me', () => {
  beforeEach(async () => {
    await prepareDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('when user is authenticated', () => {
    it('returns the logged user data without password hash', async () => {
      const loggedUser = await getSeedUser(Role.ADMIN);

      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', await authHeader(Role.ADMIN));

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        email: loggedUser.email,
        id: loggedUser.id,
        name: loggedUser.name,
        role: loggedUser.role,
      });
      expect(response.body.passwordHash).toBeUndefined();
    });
  });

  describe('when user is not authenticated', () => {
    it('returns 401 without token', async () => {
      const response = await request(app).get('/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({ message: 'Não autorizado' });
    });

    it('returns 401 with invalid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer token-invalido');

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({ message: 'Não autorizado' });
    });
  });
});
