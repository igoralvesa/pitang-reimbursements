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
  createCategoryFixture,
  createDraftReimbursementFixture,
  createSubmittedReimbursementFixture,
  getSeedUser,
} from '../helpers/factories';

describe('PUT /reimbursements/:id', () => {
  beforeEach(async () => {
    await prepareDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('when user owns a draft reimbursement', () => {
    it('updates the reimbursement', async () => {
      const category = await createCategoryFixture();
      const collaborator = await getSeedUser('colaborador@email.com');
      const reimbursement = await createDraftReimbursementFixture({
        categoryId: category.id,
        requesterId: collaborator.id,
      });

      const response = await request(app)
        .put(`/reimbursements/${reimbursement.id}`)
        .set('Authorization', await authHeader(Role.COLLABORATOR))
        .send({
          amount: 88.9,
          description: 'Táxi atualizado',
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        description: 'Táxi atualizado',
        id: reimbursement.id,
        requesterId: collaborator.id,
      });
      expect(Number(response.body.amount)).toBe(88.9);
    });

    it('creates an UPDATED history record', async () => {
      const collaborator = await getSeedUser('colaborador@email.com');
      const reimbursement = await createDraftReimbursementFixture({
        requesterId: collaborator.id,
      });

      await request(app)
        .put(`/reimbursements/${reimbursement.id}`)
        .set('Authorization', await authHeader(Role.COLLABORATOR))
        .send({ description: 'Táxi atualizado' });

      const history = await prisma.reimbursementHistory.findFirst({
        where: {
          action: ReimbursementHistoryAction.UPDATED,
          reimbursementRequestId: reimbursement.id,
          userId: collaborator.id,
        },
      });
      expect(history).toBeTruthy();
    });

    it('does not allow changing requester or status', async () => {
      const collaborator = await getSeedUser('colaborador@email.com');
      const admin = await getSeedUser('admin@email.com');
      const reimbursement = await createDraftReimbursementFixture({
        requesterId: collaborator.id,
      });

      const response = await request(app)
        .put(`/reimbursements/${reimbursement.id}`)
        .set('Authorization', await authHeader(Role.COLLABORATOR))
        .send({
          requesterId: admin.id,
          status: ReimbursementStatus.APPROVED,
          userId: admin.id,
          description: 'Descrição atualizada',
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: reimbursement.id,
        requesterId: collaborator.id,
        status: ReimbursementStatus.DRAFT,
      });
    });
  });

  describe('authorization', () => {
    it('returns 401 without token', async () => {
      const response = await request(app)
        .put('/reimbursements/00000000-0000-0000-0000-000000000000')
        .send({ description: 'Atualização' });

      expect(response.status).toBe(401);
    });

    it.each([
      ['ADMIN', Role.ADMIN],
      ['MANAGER', Role.MANAGER],
      ['FINANCE', Role.FINANCE],
    ] as const)('returns 403 with %s token', async (_label, role) => {
      const response = await request(app)
        .put('/reimbursements/00000000-0000-0000-0000-000000000000')
        .set('Authorization', await authHeader(role))
        .send({ description: 'Atualização' });

      expect(response.status).toBe(403);
    });

    it('returns 403 when collaborator updates another requester reimbursement', async () => {
      const admin = await getSeedUser('admin@email.com');
      const reimbursement = await createDraftReimbursementFixture({
        requesterId: admin.id,
      });

      const response = await request(app)
        .put(`/reimbursements/${reimbursement.id}`)
        .set('Authorization', await authHeader(Role.COLLABORATOR))
        .send({ description: 'Atualização' });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        'Usuário sem permissão para acessar este recurso',
      );
    });
  });

  describe('validation and business rules', () => {
    it('returns 400 for invalid reimbursement id', async () => {
      const response = await request(app)
        .put('/reimbursements/invalid-id')
        .set('Authorization', await authHeader(Role.COLLABORATOR))
        .send({ description: 'Atualização' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('id');
    });

    it.each([
      ['empty body', {}, ''],
      ['amount must be greater than zero', { amount: 0 }, 'amount'],
      ['invalid category id', { categoryId: 'invalid-id' }, 'categoryId'],
      ['empty description', { description: '' }, 'description'],
      ['invalid expense date', { expenseDate: 'invalid-date' }, 'expenseDate'],
    ])('returns 400 when %s', async (_case, body, field) => {
      const reimbursement = await createDraftReimbursementFixture();

      const response = await request(app)
        .put(`/reimbursements/${reimbursement.id}`)
        .set('Authorization', await authHeader(Role.COLLABORATOR))
        .send(body);

      expect(response.status).toBe(400);

      if (field) {
        expect(response.body).toHaveProperty(field);
      }
    });

    it('returns 404 when reimbursement does not exist', async () => {
      const response = await request(app)
        .put('/reimbursements/00000000-0000-0000-0000-000000000000')
        .set('Authorization', await authHeader(Role.COLLABORATOR))
        .send({ description: 'Atualização' });

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
        .put(`/reimbursements/${reimbursement.id}`)
        .set('Authorization', await authHeader(Role.COLLABORATOR))
        .send({ description: 'Atualização' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(
        'Status da solicitação não permite edição',
      );
    });

    it('returns 400 when category does not exist', async () => {
      const reimbursement = await createDraftReimbursementFixture();

      const response = await request(app)
        .put(`/reimbursements/${reimbursement.id}`)
        .set('Authorization', await authHeader(Role.COLLABORATOR))
        .send({ categoryId: '00000000-0000-0000-0000-000000000000' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Categoria inválida ou inativa');
    });

    it('returns 400 when category is inactive', async () => {
      const inactiveCategory = await createCategoryFixture({ active: false });
      const reimbursement = await createDraftReimbursementFixture();

      const response = await request(app)
        .put(`/reimbursements/${reimbursement.id}`)
        .set('Authorization', await authHeader(Role.COLLABORATOR))
        .send({ categoryId: inactiveCategory.id });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Categoria inválida ou inativa');
    });
  });
});
