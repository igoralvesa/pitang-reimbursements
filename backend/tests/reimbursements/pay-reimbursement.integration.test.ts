import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import {
  ReimbursementHistoryAction,
  ReimbursementStatus,
} from '../../generated/prisma/client';
import { prisma } from '../../src/core/prisma';
import { Role } from '../../src/types/roles-enum';
import { app } from '../helpers/app';
import { authHeader } from '../helpers/auth';
import { disconnectDatabase, prepareDatabase } from '../helpers/database';
import {
  createApprovedReimbursementFixture,
  createSubmittedReimbursementFixture,
  getSeedUser,
} from '../helpers/factories';

describe('POST /reimbursements/:id/pay', () => {
  beforeEach(async () => {
    await prepareDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('when user is authenticated as FINANCEIRO', () => {
    it('pays an approved reimbursement', async () => {
      const reimbursement = await createApprovedReimbursementFixture();

      const response = await request(app)
        .post(`/reimbursements/${reimbursement.id}/pay`)
        .set('Authorization', await authHeader(Role.FINANCE));

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(ReimbursementStatus.PAID);
    });

    it('creates a PAID history record', async () => {
      const finance = await getSeedUser('financeiro@email.com');
      const reimbursement = await createApprovedReimbursementFixture();

      await request(app)
        .post(`/reimbursements/${reimbursement.id}/pay`)
        .set('Authorization', await authHeader(Role.FINANCE));

      const history = await prisma.reimbursementHistory.findFirst({
        where: {
          action: ReimbursementHistoryAction.PAID,
          reimbursementRequestId: reimbursement.id,
          userId: finance.id,
        },
      });
      expect(history).toBeTruthy();
    });

    it('returns 400 when reimbursement is not approved', async () => {
      const reimbursement = await createSubmittedReimbursementFixture();

      const response = await request(app)
        .post(`/reimbursements/${reimbursement.id}/pay`)
        .set('Authorization', await authHeader(Role.FINANCE));

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Transição de status inválida');
    });

    it('returns 404 when reimbursement does not exist', async () => {
      const response = await request(app)
        .post('/reimbursements/00000000-0000-0000-0000-000000000000/pay')
        .set('Authorization', await authHeader(Role.FINANCE));

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(
        'Solicitação de reembolso não encontrada',
      );
    });
  });

  describe('when user has an invalid role', () => {
    it.each([
      ['ADMIN', Role.ADMIN],
      ['COLABORADOR', Role.COLLABORATOR],
      ['GESTOR', Role.MANAGER],
    ] as const)('returns 403 when user is %s', async (_label, role) => {
      const response = await request(app)
        .post('/reimbursements/00000000-0000-0000-0000-000000000000/pay')
        .set('Authorization', await authHeader(role));

      expect(response.status).toBe(403);
    });
  });

  describe('when user is not authenticated', () => {
    it('returns 401', async () => {
      const response = await request(app).post(
        '/reimbursements/00000000-0000-0000-0000-000000000000/pay',
      );

      expect(response.status).toBe(401);
    });
  });
});
