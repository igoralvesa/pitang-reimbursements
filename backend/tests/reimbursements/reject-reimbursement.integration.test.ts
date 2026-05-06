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
  createDraftReimbursementFixture,
  createSubmittedReimbursementFixture,
  getSeedUser,
} from '../helpers/factories';

describe('POST /reimbursements/:id/reject', () => {
  beforeEach(async () => {
    await prepareDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('when user is authenticated as GESTOR', () => {
    it('rejects a submitted reimbursement', async () => {
      const reimbursement = await createSubmittedReimbursementFixture();

      const response = await request(app)
        .post(`/reimbursements/${reimbursement.id}/reject`)
        .set('Authorization', await authHeader(Role.MANAGER))
        .send({ rejectionReason: 'Comprovante ilegível' });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        rejectionReason: 'Comprovante ilegível',
        status: ReimbursementStatus.REJECTED,
      });
    });

    it('creates a REJECTED history record with the reason as observation', async () => {
      const manager = await getSeedUser('gestor@email.com');
      const reimbursement = await createSubmittedReimbursementFixture();

      await request(app)
        .post(`/reimbursements/${reimbursement.id}/reject`)
        .set('Authorization', await authHeader(Role.MANAGER))
        .send({ rejectionReason: 'Comprovante ilegível' });

      const history = await prisma.reimbursementHistory.findFirst({
        where: {
          action: ReimbursementHistoryAction.REJECTED,
          reimbursementRequestId: reimbursement.id,
          userId: manager.id,
        },
      });
      expect(history?.observation).toBe('Comprovante ilegível');
    });

    it('returns 400 when rejection reason is missing', async () => {
      const response = await request(app)
        .post('/reimbursements/00000000-0000-0000-0000-000000000000/reject')
        .set('Authorization', await authHeader(Role.MANAGER))
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('rejectionReason');
    });

    it('returns 400 when reimbursement is not submitted', async () => {
      const reimbursement = await createDraftReimbursementFixture();

      const response = await request(app)
        .post(`/reimbursements/${reimbursement.id}/reject`)
        .set('Authorization', await authHeader(Role.MANAGER))
        .send({ rejectionReason: 'Comprovante ilegível' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Transição de status inválida');
    });

    it('returns 404 when reimbursement does not exist', async () => {
      const response = await request(app)
        .post('/reimbursements/00000000-0000-0000-0000-000000000000/reject')
        .set('Authorization', await authHeader(Role.MANAGER))
        .send({ rejectionReason: 'Comprovante ilegível' });

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
      ['FINANCEIRO', Role.FINANCE],
    ] as const)('returns 403 when user is %s', async (_label, role) => {
      const response = await request(app)
        .post('/reimbursements/00000000-0000-0000-0000-000000000000/reject')
        .set('Authorization', await authHeader(role))
        .send({ rejectionReason: 'Comprovante ilegível' });

      expect(response.status).toBe(403);
    });
  });

  describe('when user is not authenticated', () => {
    it('returns 401', async () => {
      const response = await request(app).post(
        '/reimbursements/00000000-0000-0000-0000-000000000000/reject',
      );

      expect(response.status).toBe(401);
    });
  });
});
