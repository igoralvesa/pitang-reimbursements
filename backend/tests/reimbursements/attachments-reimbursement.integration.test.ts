import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { Role } from '../../src/types/roles-enum';
import { app } from '../helpers/app';
import { authHeader } from '../helpers/auth';
import { disconnectDatabase, prepareDatabase } from '../helpers/database';

describe('Reimbursement attachments endpoints', () => {
  beforeEach(async () => {
    await prepareDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('POST /reimbursements/:id/attachments', () => {
    it('returns 401 without token', async () => {
      const response = await request(app).post(
        '/reimbursements/00000000-0000-0000-0000-000000000000/attachments',
      );

      expect(response.status).toBe(401);
    });

    it.each([
      ['ADMIN', Role.ADMIN],
      ['GESTOR', Role.MANAGER],
      ['FINANCEIRO', Role.FINANCE],
    ] as const)('returns 403 with %s token', async (_label, role) => {
      const response = await request(app)
        .post('/reimbursements/00000000-0000-0000-0000-000000000000/attachments')
        .set('Authorization', await authHeader(role));

      expect(response.status).toBe(403);
    });
  });

  describe('GET /reimbursements/:id/attachments', () => {
    it('returns 401 without token', async () => {
      const response = await request(app).get(
        '/reimbursements/00000000-0000-0000-0000-000000000000/attachments',
      );

      expect(response.status).toBe(401);
    });
  });
});
