import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { prisma } from '../../src/core/prisma';
import { Role } from '../../src/types/roles-enum';
import { app } from '../helpers/app';
import { authHeader } from '../helpers/auth';
import { disconnectDatabase, prepareDatabase } from '../helpers/database';
import { createUserFixture } from '../helpers/factories';

describe('DELETE /users/:id', () => {
  beforeEach(async () => {
    await prepareDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('deletes a user as ADMIN', async () => {
    const user = await createUserFixture({ email: 'delete.user@email.com' });

    const response = await request(app)
      .delete(`/users/${user.id}`)
      .set('Authorization', await authHeader(Role.ADMIN));

    expect(response.status).toBe(204);

    const deletedUser = await prisma.user.findUnique({
      where: { id: user.id },
    });
    expect(deletedUser).toBeNull();
  });
});
