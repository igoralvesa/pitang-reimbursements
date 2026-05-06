import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { app } from '../helpers/app';
import { disconnectDatabase, prepareDatabase } from '../helpers/database';

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await prepareDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('public access', () => {
    it('allows login without authentication', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'admin@email.com', password: 'Senha@123' });

      expect(response.status).toBe(200);
      expect(response.body.token).toEqual(expect.any(String));
    });
  });
});
