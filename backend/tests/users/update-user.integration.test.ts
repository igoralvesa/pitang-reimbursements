import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { Role } from '../../src/types/roles-enum';
import { app } from '../helpers/app';
import { authHeader } from '../helpers/auth';
import { disconnectDatabase, prepareDatabase } from '../helpers/database';
import { createUserFixture } from '../helpers/factories';

describe('PATCH /users/:id', () => {
  beforeEach(async () => {
    await prepareDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('updates a user as ADMIN', async () => {
    const user = await createUserFixture({ email: 'update.user@email.com' });

    const response = await request(app)
      .patch(`/users/${user.id}`)
      .set('Authorization', await authHeader(Role.ADMIN))
      .send({ name: 'Usuário Atualizado' });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Usuário Atualizado');
    expect(response.body.passwordHash).toBeUndefined();
  });
});
