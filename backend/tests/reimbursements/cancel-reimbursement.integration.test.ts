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

describe('POST /reimbursements/:id/cancel', () => {
  beforeEach(async () => {
    await prepareDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('when user owns a draft reimbursement', () => {
    it('cancels the reimbursement', async () => {
      const collaborator = await getSeedUser('colaborador@email.com');
      const reimbursement = await createDraftReimbursementFixture({
        requesterId: collaborator.id,
      });

      const response = await request(app)
        .post(`/reimbursements/${reimbursement.id}/cancel`)
        .set('Authorization', await authHeader(Role.COLLABORATOR));

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(ReimbursementStatus.CANCELED);
    });

    it('creates a CANCELED history record', async () => {
      const collaborator = await getSeedUser('colaborador@email.com');
      const reimbursement = await createDraftReimbursementFixture({
        requesterId: collaborator.id,
      });

      await request(app)
        .post(`/reimbursements/${reimbursement.id}/cancel`)
        .set('Authorization', await authHeader(Role.COLLABORATOR));

      const history = await prisma.reimbursementHistory.findFirst({
        where: {
          action: ReimbursementHistoryAction.CANCELED,
          reimbursementRequestId: reimbursement.id,
          userId: collaborator.id,
        },
      });
      expect(history).toBeTruthy();
    });
  });

  describe('authorization', () => {
    it('returns 401 without token', async () => {
      const response = await request(app).post(
        '/reimbursements/00000000-0000-0000-0000-000000000000/cancel',
      );

      expect(response.status).toBe(401);
    });

    it.each([
      ['ADMIN', Role.ADMIN],
      ['MANAGER', Role.MANAGER],
      ['FINANCE', Role.FINANCE],
    ] as const)('returns 403 with %s token', async (_label, role) => {
      const response = await request(app)
        .post('/reimbursements/00000000-0000-0000-0000-000000000000/cancel')
        .set('Authorization', await authHeader(role));

      expect(response.status).toBe(403);
    });

    it('returns 403 for another requester reimbursement', async () => {
      const admin = await getSeedUser('admin@email.com');
      const reimbursement = await createDraftReimbursementFixture({
        requesterId: admin.id,
      });

      const response = await request(app)
        .post(`/reimbursements/${reimbursement.id}/cancel`)
        .set('Authorization', await authHeader(Role.COLLABORATOR));

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        'Usuário sem permissão para acessar este recurso',
      );
    });
  });

  describe('business rules', () => {
    it('returns 404 when reimbursement does not exist', async () => {
      const response = await request(app)
        .post('/reimbursements/00000000-0000-0000-0000-000000000000/cancel')
        .set('Authorization', await authHeader(Role.COLLABORATOR));

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(
        'Solicitação de reembolso não encontrada',
      );
    });

    it('returns 400 when reimbursement is not draft', async () => {
      const collaborator = await getSeedUser('colaborador@email.com');
      const reimbursement = await createSubmittedReimbursementFixture({
        requesterId: collaborator.id,
      });

      const response = await request(app)
        .post(`/reimbursements/${reimbursement.id}/cancel`)
        .set('Authorization', await authHeader(Role.COLLABORATOR));

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Transição de status inválida');
    });
  });
});
