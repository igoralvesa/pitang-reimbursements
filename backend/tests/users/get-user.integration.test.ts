import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { Role } from '../../src/types/roles-enum';
import { app } from '../helpers/app';
import { authHeader } from '../helpers/auth';
import { disconnectDatabase, prepareDatabase } from '../helpers/database';
import { createUserFixture } from '../helpers/factories';

describe('GET /users/:id', () => {
  beforeEach(async () => {
    await prepareDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('gets a user by id as ADMIN', async () => {
    const user = await createUserFixture({ email: 'get.user@email.com' });

    const response = await request(app)
      .get(`/users/${user.id}`)
      .set('Authorization', await authHeader(Role.ADMIN));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      email: user.email,
      id: user.id,
    });
    expect(response.body.passwordHash).toBeUndefined();
  });

  it('returns 404 when getting nonexistent user', async () => {
    const response = await request(app)
      .get('/users/00000000-0000-0000-0000-000000000000')
      .set('Authorization', await authHeader(Role.ADMIN));

    expect(response.status).toBe(404);
  });
});
