import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { ReimbursementHistoryAction } from '../../generated/prisma/client';
import { prisma } from '../../src/core/prisma';
import { Role } from '../../src/types/roles-enum';
import { app } from '../helpers/app';
import { authHeader } from '../helpers/auth';
import { disconnectDatabase, prepareDatabase } from '../helpers/database';
import {
  createApprovedReimbursementFixture,
  createDraftReimbursementFixture,
  createSubmittedReimbursementFixture,
  getSeedUser,
} from '../helpers/factories';

describe('GET /reimbursements/:id/history', () => {
  beforeEach(async () => {
    await prepareDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('when user has permission', () => {
    it('lists reimbursement history with only request, user, action, timestamp and observation', async () => {
      const collaborator = await getSeedUser('colaborador@email.com');
      const reimbursement = await createDraftReimbursementFixture({
        requesterId: collaborator.id,
      });

      await prisma.reimbursementHistory.createMany({
        data: [
          {
            action: ReimbursementHistoryAction.CREATED,
            observation: 'Solicitação criada',
            reimbursementRequestId: reimbursement.id,
            userId: collaborator.id,
          },
          {
            action: ReimbursementHistoryAction.UPDATED,
            observation: 'Solicitação atualizada',
            reimbursementRequestId: reimbursement.id,
            userId: collaborator.id,
          },
        ],
      });

      const response = await request(app)
        .get(`/reimbursements/${reimbursement.id}/history`)
        .set('Authorization', await authHeader(Role.COLLABORATOR));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        action: ReimbursementHistoryAction.CREATED,
        observation: 'Solicitação criada',
        reimbursementRequestId: reimbursement.id,
        userId: collaborator.id,
      });
      expect(response.body[0].createdAt).toEqual(expect.any(String));
      expect(Object.keys(response.body[0]).sort()).toEqual([
        'action',
        'createdAt',
        'observation',
        'reimbursementRequestId',
        'userId',
      ]);
    });

    it('allows ADMIN to list any reimbursement history', async () => {
      const reimbursement = await createDraftReimbursementFixture();

      const response = await request(app)
        .get(`/reimbursements/${reimbursement.id}/history`)
        .set('Authorization', await authHeader(Role.ADMIN));

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('allows MANAGER to list submitted reimbursement history', async () => {
      const reimbursement = await createSubmittedReimbursementFixture();

      const response = await request(app)
        .get(`/reimbursements/${reimbursement.id}/history`)
        .set('Authorization', await authHeader(Role.MANAGER));

      expect(response.status).toBe(200);
    });

    it('allows FINANCE to list approved reimbursement history', async () => {
      const reimbursement = await createApprovedReimbursementFixture();

      const response = await request(app)
        .get(`/reimbursements/${reimbursement.id}/history`)
        .set('Authorization', await authHeader(Role.FINANCE));

      expect(response.status).toBe(200);
    });
  });

  describe('authorization', () => {
    it('returns 401 without token', async () => {
      const response = await request(app).get(
        '/reimbursements/00000000-0000-0000-0000-000000000000/history',
      );

      expect(response.status).toBe(401);
    });

    it('returns 403 when collaborator accesses another requester history', async () => {
      const admin = await getSeedUser('admin@email.com');
      const reimbursement = await createDraftReimbursementFixture({
        requesterId: admin.id,
      });

      const response = await request(app)
        .get(`/reimbursements/${reimbursement.id}/history`)
        .set('Authorization', await authHeader(Role.COLLABORATOR));

      expect(response.status).toBe(403);
    });

    it('returns 403 when manager accesses non-submitted reimbursement history', async () => {
      const reimbursement = await createApprovedReimbursementFixture();

      const response = await request(app)
        .get(`/reimbursements/${reimbursement.id}/history`)
        .set('Authorization', await authHeader(Role.MANAGER));

      expect(response.status).toBe(403);
    });

    it('returns 403 when finance accesses non-approved reimbursement history', async () => {
      const reimbursement = await createSubmittedReimbursementFixture();

      const response = await request(app)
        .get(`/reimbursements/${reimbursement.id}/history`)
        .set('Authorization', await authHeader(Role.FINANCE));

      expect(response.status).toBe(403);
    });
  });

  describe('validation and missing resources', () => {
    it('returns 400 for invalid reimbursement id', async () => {
      const response = await request(app)
        .get('/reimbursements/invalid-id/history')
        .set('Authorization', await authHeader(Role.ADMIN));

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('id');
    });

    it('returns 404 when reimbursement does not exist', async () => {
      const response = await request(app)
        .get('/reimbursements/00000000-0000-0000-0000-000000000000/history')
        .set('Authorization', await authHeader(Role.ADMIN));

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(
        'Solicitação de reembolso não encontrada',
      );
    });
  });
});
