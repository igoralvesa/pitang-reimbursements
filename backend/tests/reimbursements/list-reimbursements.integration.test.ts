import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { ReimbursementStatus } from '../../generated/prisma/client';
import { prisma } from '../../src/core/prisma';
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

describe('GET /reimbursements', () => {
  beforeEach(async () => {
    await prepareDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('when user is authenticated', () => {
    it('lists only own reimbursements as COLLABORATOR', async () => {
      const category = await createCategoryFixture();
      const collaborator = await getSeedUser('colaborador@email.com');
      const admin = await getSeedUser('admin@email.com');
      const ownReimbursement = await createDraftReimbursementFixture({
        categoryId: category.id,
        requesterId: collaborator.id,
      });
      await createDraftReimbursementFixture({
        categoryId: category.id,
        requesterId: admin.id,
      });

      const response = await request(app)
        .get('/reimbursements')
        .set('Authorization', await authHeader(Role.COLLABORATOR));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(ownReimbursement.id);
      expect(response.body[0].requesterId).toBe(collaborator.id);
    });

    it('lists all reimbursements as ADMIN', async () => {
      const category = await createCategoryFixture();
      const collaborator = await getSeedUser('colaborador@email.com');
      const admin = await getSeedUser('admin@email.com');
      const collaboratorReimbursement = await createDraftReimbursementFixture({
        categoryId: category.id,
        requesterId: collaborator.id,
      });
      const adminReimbursement = await createDraftReimbursementFixture({
        categoryId: category.id,
        requesterId: admin.id,
      });

      const response = await request(app)
        .get('/reimbursements')
        .set('Authorization', await authHeader(Role.ADMIN));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.map((item: { id: string }) => item.id)).toEqual(
        expect.arrayContaining([
          collaboratorReimbursement.id,
          adminReimbursement.id,
        ]),
      );
    });

    it('lists only submitted reimbursements as MANAGER', async () => {
      const category = await createCategoryFixture();
      const collaborator = await getSeedUser('colaborador@email.com');
      const submittedReimbursement = await createSubmittedReimbursementFixture({
        categoryId: category.id,
        requesterId: collaborator.id,
      });
      await createDraftReimbursementFixture({
        categoryId: category.id,
        requesterId: collaborator.id,
      });

      const response = await request(app)
        .get('/reimbursements')
        .set('Authorization', await authHeader(Role.MANAGER));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(submittedReimbursement.id);
      expect(response.body[0].status).toBe(ReimbursementStatus.SUBMITTED);
    });

    it('lists only approved reimbursements as FINANCE', async () => {
      const category = await createCategoryFixture();
      const collaborator = await getSeedUser('colaborador@email.com');
      const approvedReimbursement = await createApprovedReimbursementFixture({
        categoryId: category.id,
        requesterId: collaborator.id,
      });
      await createSubmittedReimbursementFixture({
        categoryId: category.id,
        requesterId: collaborator.id,
      });

      const response = await request(app)
        .get('/reimbursements')
        .set('Authorization', await authHeader(Role.FINANCE));

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(approvedReimbursement.id);
      expect(response.body[0].status).toBe(ReimbursementStatus.APPROVED);
    });
  });

  describe('when user is not authenticated', () => {
    it('returns 401', async () => {
      const response = await request(app).get('/reimbursements');

      expect(response.status).toBe(401);
    });
  });
});
