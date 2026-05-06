import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { ReimbursementStatus } from '../../generated/prisma/client';
import { Role } from '../../src/types/roles-enum';
import { app } from '../helpers/app';
import { authHeader } from '../helpers/auth';
import { disconnectDatabase, prepareDatabase } from '../helpers/database';
import {
  createApprovedReimbursementFixture,
  createCategoryFixture,
  createDraftReimbursementFixture,
  createSubmittedReimbursementFixture,
  getSeedUser,
} from '../helpers/factories';

describe('GET /reimbursements/:id', () => {
  beforeEach(async () => {
    await prepareDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('when user has permission', () => {
    it('gets own reimbursement by id as COLLABORATOR', async () => {
      const category = await createCategoryFixture();
      const collaborator = await getSeedUser('colaborador@email.com');
      const reimbursement = await createDraftReimbursementFixture({
        categoryId: category.id,
        requesterId: collaborator.id,
      });

      const response = await request(app)
        .get(`/reimbursements/${reimbursement.id}`)
        .set('Authorization', await authHeader(Role.COLLABORATOR));

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        categoryId: category.id,
        id: reimbursement.id,
        requesterId: collaborator.id,
      });
      expect(response.body.category).toMatchObject({ id: category.id });
      expect(response.body.requester).toMatchObject({
        id: collaborator.id,
        email: collaborator.email,
      });
    });

    it('gets any reimbursement by id as ADMIN', async () => {
      const collaborator = await getSeedUser('colaborador@email.com');
      const reimbursement = await createDraftReimbursementFixture({
        requesterId: collaborator.id,
      });

      const response = await request(app)
        .get(`/reimbursements/${reimbursement.id}`)
        .set('Authorization', await authHeader(Role.ADMIN));

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(reimbursement.id);
    });

    it('gets submitted reimbursement by id as MANAGER', async () => {
      const collaborator = await getSeedUser('colaborador@email.com');
      const reimbursement = await createSubmittedReimbursementFixture({
        requesterId: collaborator.id,
      });

      const response = await request(app)
        .get(`/reimbursements/${reimbursement.id}`)
        .set('Authorization', await authHeader(Role.MANAGER));

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(reimbursement.id);
      expect(response.body.status).toBe(ReimbursementStatus.SUBMITTED);
    });

    it('gets approved reimbursement by id as FINANCE', async () => {
      const collaborator = await getSeedUser('colaborador@email.com');
      const reimbursement = await createApprovedReimbursementFixture({
        requesterId: collaborator.id,
      });

      const response = await request(app)
        .get(`/reimbursements/${reimbursement.id}`)
        .set('Authorization', await authHeader(Role.FINANCE));

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(reimbursement.id);
      expect(response.body.status).toBe(ReimbursementStatus.APPROVED);
    });
  });

  describe('authorization', () => {
    it('returns 401 without token', async () => {
      const response = await request(app).get(
        '/reimbursements/00000000-0000-0000-0000-000000000000',
      );

      expect(response.status).toBe(401);
    });

    it('returns 403 when collaborator accesses another requester reimbursement', async () => {
      const admin = await getSeedUser('admin@email.com');
      const reimbursement = await createDraftReimbursementFixture({
        requesterId: admin.id,
      });

      const response = await request(app)
        .get(`/reimbursements/${reimbursement.id}`)
        .set('Authorization', await authHeader(Role.COLLABORATOR));

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        'Usuário sem permissão para acessar este recurso',
      );
    });

    it('returns 403 when manager accesses non-submitted reimbursement', async () => {
      const reimbursement = await createApprovedReimbursementFixture();

      const response = await request(app)
        .get(`/reimbursements/${reimbursement.id}`)
        .set('Authorization', await authHeader(Role.MANAGER));

      expect(response.status).toBe(403);
    });

    it('returns 403 when finance accesses non-approved reimbursement', async () => {
      const reimbursement = await createSubmittedReimbursementFixture();

      const response = await request(app)
        .get(`/reimbursements/${reimbursement.id}`)
        .set('Authorization', await authHeader(Role.FINANCE));

      expect(response.status).toBe(403);
    });
  });

  describe('validation and missing resources', () => {
    it('returns 400 for invalid reimbursement id', async () => {
      const response = await request(app)
        .get('/reimbursements/invalid-id')
        .set('Authorization', await authHeader(Role.ADMIN));

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('id');
    });

    it('returns 404 when reimbursement does not exist', async () => {
      const response = await request(app)
        .get('/reimbursements/00000000-0000-0000-0000-000000000000')
        .set('Authorization', await authHeader(Role.ADMIN));

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(
        'Solicitação de reembolso não encontrada',
      );
    });
  });
});
