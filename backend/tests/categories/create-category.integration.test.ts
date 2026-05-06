import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { Role } from '../../src/types/roles-enum';
import { app } from '../helpers/app';
import { authHeader } from '../helpers/auth';
import { disconnectDatabase, prepareDatabase } from '../helpers/database';

describe('POST /categories', () => {
  beforeEach(async () => {
    await prepareDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('when user is authenticated as ADMIN', () => {
    it('creates a category', async () => {
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
  });

  describe('validation', () => {
    it.each([
      ['name required', {}],
      ['name cannot be empty', { name: '' }],
    ])('returns 400 when %s', async (_case, body) => {
      const response = await request(app)
        .post('/categories')
        .set('Authorization', await authHeader(Role.ADMIN))
        .send(body);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('name');
    });
  });

  describe('authorization', () => {
    it('returns 401 without token', async () => {
      const response = await request(app)
        .post('/categories')
        .send({ name: 'Transport' });

      expect(response.status).toBe(401);
    });

    it.each([
      ['COLABORADOR', Role.COLLABORATOR],
      ['GESTOR', Role.MANAGER],
      ['FINANCEIRO', Role.FINANCE],
    ] as const)('returns 403 with %s token', async (_label, role) => {
      const response = await request(app)
        .post('/categories')
        .set('Authorization', await authHeader(role))
        .send({ name: 'Transport' });

      expect(response.status).toBe(403);
    });
  });
});
