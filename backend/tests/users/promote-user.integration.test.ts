import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { Role } from '../../src/types/roles-enum';
import { app } from '../helpers/app';
import { authHeader } from '../helpers/auth';
import { disconnectDatabase, prepareDatabase } from '../helpers/database';
import { createUserFixture } from '../helpers/factories';

describe('POST /users/:id/promote', () => {
  beforeEach(async () => {
    await prepareDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('promotes a user as ADMIN', async () => {
    const user = await createUserFixture({ email: 'promote.user@email.com' });

    const response = await request(app)
      .post(`/users/${user.id}/promote`)
      .set('Authorization', await authHeader(Role.ADMIN))
      .send({ role: Role.FINANCE });

    expect(response.status).toBe(200);
    expect(response.body.role).toBe(Role.FINANCE);
  });
});
