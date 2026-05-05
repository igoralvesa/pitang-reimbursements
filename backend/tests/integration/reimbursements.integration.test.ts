import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';

import { ReimbursementHistoryAction, ReimbursementStatus } from '../../generated/prisma/client';
import { app } from '../../src/app';
import { prisma } from '../../src/core/prisma';
import { Role } from '../../src/types/roles-enum';
import { authHeader } from '../helpers/auth';
import { disconnectDatabase, prepareDatabase } from '../helpers/test-db';

async function getSeedUser(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new Error(`Seed user ${email} not found`);
  }

  return user;
}

async function createCategory(active = true) {
  return prisma.category.create({
    data: {
      active,
      name: active ? 'Transporte' : 'Categoria Inativa',
    },
  });
}

async function createReimbursementFixture({
  categoryId,
  requesterId,
  status = ReimbursementStatus.DRAFT,
}: {
  categoryId: string;
  requesterId: string;
  status?: ReimbursementStatus;
}) {
  return prisma.reimbursementRequest.create({
    data: {
      amount: 50,
      categoryId,
      description: 'Táxi para reunião',
      expenseDate: new Date('2026-05-01T00:00:00.000Z'),
      requesterId,
      status,
    },
  });
}

describe('Reimbursements endpoints', () => {
  beforeEach(async () => {
    await prepareDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('GET /reimbursements', () => {
    it('lists only own reimbursements as COLLABORATOR', async () => {
      const category = await createCategory();
      const collaborator = await getSeedUser('colaborador@email.com');
      const admin = await getSeedUser('admin@email.com');
      const ownReimbursement = await createReimbursementFixture({
        categoryId: category.id,
        requesterId: collaborator.id,
      });
      await createReimbursementFixture({
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
      const category = await createCategory();
      const collaborator = await getSeedUser('colaborador@email.com');
      const admin = await getSeedUser('admin@email.com');
      const collaboratorReimbursement = await createReimbursementFixture({
        categoryId: category.id,
        requesterId: collaborator.id,
      });
      const adminReimbursement = await createReimbursementFixture({
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

    it('rejects list reimbursements without token with 401', async () => {
      const response = await request(app).get('/reimbursements');

      expect(response.status).toBe(401);
    });

    it('rejects list reimbursements with MANAGER token with 403', async () => {
      const response = await request(app)
        .get('/reimbursements')
        .set('Authorization', await authHeader(Role.MANAGER));

      expect(response.status).toBe(403);
    });
  });

  describe('POST /reimbursements', () => {
    it('creates reimbursement successfully as COLLABORATOR', async () => {
      const category = await createCategory();
      const collaborator = await getSeedUser('colaborador@email.com');

      const response = await request(app)
        .post('/reimbursements')
        .set('Authorization', await authHeader(Role.COLLABORATOR))
        .send({
          amount: 120.75,
          categoryId: category.id,
          description: 'Almoço com cliente',
          expenseDate: '2026-05-01',
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        categoryId: category.id,
        description: 'Almoço com cliente',
        requesterId: collaborator.id,
        status: ReimbursementStatus.DRAFT,
      });
      expect(Number(response.body.amount)).toBe(120.75);

      const history = await prisma.reimbursementHistory.findFirst({
        where: {
          action: ReimbursementHistoryAction.CREATED,
          reimbursementRequestId: response.body.id,
          userId: collaborator.id,
        },
      });
      expect(history).toBeTruthy();
    });

    it.each([
      ['amount must be greater than zero', { amount: 0 }, 'amount'],
      ['expense date is required', { expenseDate: undefined }, 'expenseDate'],
    ])('validates create reimbursement body: %s', async (_case, override, field) => {
      const category = await createCategory();

      const response = await request(app)
        .post('/reimbursements')
        .set('Authorization', await authHeader(Role.COLLABORATOR))
        .send({
          amount: 120.75,
          categoryId: category.id,
          description: 'Almoço com cliente',
          expenseDate: '2026-05-01',
          ...override,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(field);
    });

    it('rejects reimbursement creation with nonexistent category', async () => {
      const response = await request(app)
        .post('/reimbursements')
        .set('Authorization', await authHeader(Role.COLLABORATOR))
        .send({
          amount: 120.75,
          categoryId: '00000000-0000-0000-0000-000000000000',
          description: 'Almoço com cliente',
          expenseDate: '2026-05-01',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Categoria inválida ou inativa');
    });

    it('rejects reimbursement creation with inactive category', async () => {
      const category = await createCategory(false);

      const response = await request(app)
        .post('/reimbursements')
        .set('Authorization', await authHeader(Role.COLLABORATOR))
        .send({
          amount: 120.75,
          categoryId: category.id,
          description: 'Almoço com cliente',
          expenseDate: '2026-05-01',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Categoria inválida ou inativa');
    });

    it('rejects reimbursement creation without token with 401', async () => {
      const category = await createCategory();

      const response = await request(app).post('/reimbursements').send({
        amount: 120.75,
        categoryId: category.id,
        description: 'Almoço com cliente',
        expenseDate: '2026-05-01',
      });

      expect(response.status).toBe(401);
    });

    it('rejects reimbursement creation with MANAGER token with 403', async () => {
      const category = await createCategory();

      const response = await request(app)
        .post('/reimbursements')
        .set('Authorization', await authHeader(Role.MANAGER))
        .send({
          amount: 120.75,
          categoryId: category.id,
          description: 'Almoço com cliente',
          expenseDate: '2026-05-01',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /reimbursements/:id', () => {
    it('gets own reimbursement by id as COLLABORATOR', async () => {
      const category = await createCategory();
      const collaborator = await getSeedUser('colaborador@email.com');
      const reimbursement = await createReimbursementFixture({
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
      const category = await createCategory();
      const collaborator = await getSeedUser('colaborador@email.com');
      const reimbursement = await createReimbursementFixture({
        categoryId: category.id,
        requesterId: collaborator.id,
      });

      const response = await request(app)
        .get(`/reimbursements/${reimbursement.id}`)
        .set('Authorization', await authHeader(Role.ADMIN));

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(reimbursement.id);
    });

    it('rejects get reimbursement by id without token with 401', async () => {
      const response = await request(app).get(
        '/reimbursements/00000000-0000-0000-0000-000000000000',
      );

      expect(response.status).toBe(401);
    });

    it('rejects get reimbursement by id with MANAGER token with 403', async () => {
      const response = await request(app)
        .get('/reimbursements/00000000-0000-0000-0000-000000000000')
        .set('Authorization', await authHeader(Role.MANAGER));

      expect(response.status).toBe(403);
    });

    it('rejects invalid reimbursement id with 400', async () => {
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

    it('rejects collaborator access to another requester reimbursement with 403', async () => {
      const category = await createCategory();
      const admin = await getSeedUser('admin@email.com');
      const reimbursement = await createReimbursementFixture({
        categoryId: category.id,
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
  });

  describe('PUT /reimbursements/:id', () => {
    it('updates own draft reimbursement as COLLABORATOR', async () => {
      const category = await createCategory();
      const collaborator = await getSeedUser('colaborador@email.com');
      const reimbursement = await createReimbursementFixture({
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

      const history = await prisma.reimbursementHistory.findFirst({
        where: {
          action: ReimbursementHistoryAction.UPDATED,
          reimbursementRequestId: reimbursement.id,
          userId: collaborator.id,
        },
      });
      expect(history).toBeTruthy();
    });

    it('updates any reimbursement as ADMIN even when it is not draft', async () => {
      const category = await createCategory();
      const newCategory = await createCategory();
      const collaborator = await getSeedUser('colaborador@email.com');
      const admin = await getSeedUser('admin@email.com');
      const reimbursement = await createReimbursementFixture({
        categoryId: category.id,
        requesterId: collaborator.id,
        status: ReimbursementStatus.SUBMITTED,
      });

      const response = await request(app)
        .put(`/reimbursements/${reimbursement.id}`)
        .set('Authorization', await authHeader(Role.ADMIN))
        .send({
          categoryId: newCategory.id,
          expenseDate: '2026-05-02',
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        categoryId: newCategory.id,
        id: reimbursement.id,
        status: ReimbursementStatus.SUBMITTED,
      });

      const history = await prisma.reimbursementHistory.findFirst({
        where: {
          action: ReimbursementHistoryAction.UPDATED,
          reimbursementRequestId: reimbursement.id,
          userId: admin.id,
        },
      });
      expect(history).toBeTruthy();
    });

    it('rejects update reimbursement without token with 401', async () => {
      const response = await request(app)
        .put('/reimbursements/00000000-0000-0000-0000-000000000000')
        .send({ description: 'Atualização' });

      expect(response.status).toBe(401);
    });

    it('rejects update reimbursement with MANAGER token with 403', async () => {
      const response = await request(app)
        .put('/reimbursements/00000000-0000-0000-0000-000000000000')
        .set('Authorization', await authHeader(Role.MANAGER))
        .send({ description: 'Atualização' });

      expect(response.status).toBe(403);
    });

    it('rejects invalid reimbursement id with 400', async () => {
      const response = await request(app)
        .put('/reimbursements/invalid-id')
        .set('Authorization', await authHeader(Role.ADMIN))
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
    ])('validates update reimbursement body: %s', async (_case, body, field) => {
      const category = await createCategory();
      const collaborator = await getSeedUser('colaborador@email.com');
      const reimbursement = await createReimbursementFixture({
        categoryId: category.id,
        requesterId: collaborator.id,
      });

      const response = await request(app)
        .put(`/reimbursements/${reimbursement.id}`)
        .set('Authorization', await authHeader(Role.COLLABORATOR))
        .send(body);

      expect(response.status).toBe(400);

      if (field) {
        expect(response.body).toHaveProperty(field);
      }
    });

    it('returns 404 when updating nonexistent reimbursement', async () => {
      const response = await request(app)
        .put('/reimbursements/00000000-0000-0000-0000-000000000000')
        .set('Authorization', await authHeader(Role.ADMIN))
        .send({ description: 'Atualização' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(
        'Solicitação de reembolso não encontrada',
      );
    });

    it('rejects collaborator update to another requester reimbursement with 403', async () => {
      const category = await createCategory();
      const admin = await getSeedUser('admin@email.com');
      const reimbursement = await createReimbursementFixture({
        categoryId: category.id,
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

    it('rejects collaborator update when reimbursement is not draft with 400', async () => {
      const category = await createCategory();
      const collaborator = await getSeedUser('colaborador@email.com');
      const reimbursement = await createReimbursementFixture({
        categoryId: category.id,
        requesterId: collaborator.id,
        status: ReimbursementStatus.SUBMITTED,
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

    it('rejects update with nonexistent category', async () => {
      const category = await createCategory();
      const collaborator = await getSeedUser('colaborador@email.com');
      const reimbursement = await createReimbursementFixture({
        categoryId: category.id,
        requesterId: collaborator.id,
      });

      const response = await request(app)
        .put(`/reimbursements/${reimbursement.id}`)
        .set('Authorization', await authHeader(Role.COLLABORATOR))
        .send({ categoryId: '00000000-0000-0000-0000-000000000000' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Categoria inválida ou inativa');
    });

    it('rejects update with inactive category', async () => {
      const category = await createCategory();
      const inactiveCategory = await createCategory(false);
      const collaborator = await getSeedUser('colaborador@email.com');
      const reimbursement = await createReimbursementFixture({
        categoryId: category.id,
        requesterId: collaborator.id,
      });

      const response = await request(app)
        .put(`/reimbursements/${reimbursement.id}`)
        .set('Authorization', await authHeader(Role.COLLABORATOR))
        .send({ categoryId: inactiveCategory.id });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Categoria inválida ou inativa');
    });
  });

  describe('POST /reimbursements/:id/submit', () => {
    it('submits own draft reimbursement as COLLABORATOR', async () => {
      const category = await createCategory();
      const collaborator = await getSeedUser('colaborador@email.com');
      const reimbursement = await createReimbursementFixture({
        categoryId: category.id,
        requesterId: collaborator.id,
      });

      const response = await request(app)
        .post(`/reimbursements/${reimbursement.id}/submit`)
        .set('Authorization', await authHeader(Role.COLLABORATOR));

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(ReimbursementStatus.SUBMITTED);

      const history = await prisma.reimbursementHistory.findFirst({
        where: {
          action: ReimbursementHistoryAction.SUBMITTED,
          reimbursementRequestId: reimbursement.id,
          userId: collaborator.id,
        },
      });
      expect(history).toBeTruthy();
    });

    it('rejects submit without token with 401', async () => {
      const response = await request(app).post(
        '/reimbursements/00000000-0000-0000-0000-000000000000/submit',
      );

      expect(response.status).toBe(401);
    });

    it('rejects submit with invalid role with 403', async () => {
      const response = await request(app)
        .post('/reimbursements/00000000-0000-0000-0000-000000000000/submit')
        .set('Authorization', await authHeader(Role.MANAGER));

      expect(response.status).toBe(403);
    });

    it('returns 404 when submitting nonexistent reimbursement', async () => {
      const response = await request(app)
        .post('/reimbursements/00000000-0000-0000-0000-000000000000/submit')
        .set('Authorization', await authHeader(Role.COLLABORATOR));

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(
        'Solicitação de reembolso não encontrada',
      );
    });

    it('rejects submit for another requester reimbursement with 403', async () => {
      const category = await createCategory();
      const admin = await getSeedUser('admin@email.com');
      const reimbursement = await createReimbursementFixture({
        categoryId: category.id,
        requesterId: admin.id,
      });

      const response = await request(app)
        .post(`/reimbursements/${reimbursement.id}/submit`)
        .set('Authorization', await authHeader(Role.COLLABORATOR));

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(
        'Usuário sem permissão para acessar este recurso',
      );
    });

    it('rejects submit when reimbursement is not draft with 400', async () => {
      const category = await createCategory();
      const collaborator = await getSeedUser('colaborador@email.com');
      const reimbursement = await createReimbursementFixture({
        categoryId: category.id,
        requesterId: collaborator.id,
        status: ReimbursementStatus.SUBMITTED,
      });

      const response = await request(app)
        .post(`/reimbursements/${reimbursement.id}/submit`)
        .set('Authorization', await authHeader(Role.COLLABORATOR));

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Transição de status inválida');
    });
  });

  describe('POST /reimbursements/:id/approve', () => {
    it('approves submitted reimbursement as MANAGER', async () => {
      const category = await createCategory();
      const collaborator = await getSeedUser('colaborador@email.com');
      const manager = await getSeedUser('gestor@email.com');
      const reimbursement = await createReimbursementFixture({
        categoryId: category.id,
        requesterId: collaborator.id,
        status: ReimbursementStatus.SUBMITTED,
      });

      const response = await request(app)
        .post(`/reimbursements/${reimbursement.id}/approve`)
        .set('Authorization', await authHeader(Role.MANAGER));

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(ReimbursementStatus.APPROVED);

      const history = await prisma.reimbursementHistory.findFirst({
        where: {
          action: ReimbursementHistoryAction.APPROVED,
          reimbursementRequestId: reimbursement.id,
          userId: manager.id,
        },
      });
      expect(history).toBeTruthy();
    });

    it('rejects approve without token with 401', async () => {
      const response = await request(app).post(
        '/reimbursements/00000000-0000-0000-0000-000000000000/approve',
      );

      expect(response.status).toBe(401);
    });

    it('rejects approve with invalid role with 403', async () => {
      const response = await request(app)
        .post('/reimbursements/00000000-0000-0000-0000-000000000000/approve')
        .set('Authorization', await authHeader(Role.ADMIN));

      expect(response.status).toBe(403);
    });

    it('returns 404 when approving nonexistent reimbursement', async () => {
      const response = await request(app)
        .post('/reimbursements/00000000-0000-0000-0000-000000000000/approve')
        .set('Authorization', await authHeader(Role.MANAGER));

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(
        'Solicitação de reembolso não encontrada',
      );
    });

    it('rejects approve when reimbursement is not submitted with 400', async () => {
      const category = await createCategory();
      const collaborator = await getSeedUser('colaborador@email.com');
      const reimbursement = await createReimbursementFixture({
        categoryId: category.id,
        requesterId: collaborator.id,
      });

      const response = await request(app)
        .post(`/reimbursements/${reimbursement.id}/approve`)
        .set('Authorization', await authHeader(Role.MANAGER));

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Transição de status inválida');
    });
  });

  describe('POST /reimbursements/:id/reject', () => {
    it('rejects submitted reimbursement as MANAGER', async () => {
      const category = await createCategory();
      const collaborator = await getSeedUser('colaborador@email.com');
      const manager = await getSeedUser('gestor@email.com');
      const reimbursement = await createReimbursementFixture({
        categoryId: category.id,
        requesterId: collaborator.id,
        status: ReimbursementStatus.SUBMITTED,
      });

      const response = await request(app)
        .post(`/reimbursements/${reimbursement.id}/reject`)
        .set('Authorization', await authHeader(Role.MANAGER))
        .send({ rejectionReason: 'Comprovante ilegível' });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        rejectionReason: 'Comprovante ilegível',
        status: ReimbursementStatus.REJECTED,
      });

      const history = await prisma.reimbursementHistory.findFirst({
        where: {
          action: ReimbursementHistoryAction.REJECTED,
          reimbursementRequestId: reimbursement.id,
          userId: manager.id,
        },
      });
      expect(history?.observation).toBe('Comprovante ilegível');
    });

    it('rejects reject without token with 401', async () => {
      const response = await request(app).post(
        '/reimbursements/00000000-0000-0000-0000-000000000000/reject',
      );

      expect(response.status).toBe(401);
    });

    it('rejects reject with invalid role with 403', async () => {
      const response = await request(app)
        .post('/reimbursements/00000000-0000-0000-0000-000000000000/reject')
        .set('Authorization', await authHeader(Role.COLLABORATOR))
        .send({ rejectionReason: 'Comprovante ilegível' });

      expect(response.status).toBe(403);
    });

    it('validates rejection reason with 400', async () => {
      const response = await request(app)
        .post('/reimbursements/00000000-0000-0000-0000-000000000000/reject')
        .set('Authorization', await authHeader(Role.MANAGER))
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('rejectionReason');
    });

    it('returns 404 when rejecting nonexistent reimbursement', async () => {
      const response = await request(app)
        .post('/reimbursements/00000000-0000-0000-0000-000000000000/reject')
        .set('Authorization', await authHeader(Role.MANAGER))
        .send({ rejectionReason: 'Comprovante ilegível' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(
        'Solicitação de reembolso não encontrada',
      );
    });

    it('rejects reject when reimbursement is not submitted with 400', async () => {
      const category = await createCategory();
      const collaborator = await getSeedUser('colaborador@email.com');
      const reimbursement = await createReimbursementFixture({
        categoryId: category.id,
        requesterId: collaborator.id,
      });

      const response = await request(app)
        .post(`/reimbursements/${reimbursement.id}/reject`)
        .set('Authorization', await authHeader(Role.MANAGER))
        .send({ rejectionReason: 'Comprovante ilegível' });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Transição de status inválida');
    });
  });

  describe('POST /reimbursements/:id/pay', () => {
    it('pays approved reimbursement as FINANCE', async () => {
      const category = await createCategory();
      const collaborator = await getSeedUser('colaborador@email.com');
      const finance = await getSeedUser('financeiro@email.com');
      const reimbursement = await createReimbursementFixture({
        categoryId: category.id,
        requesterId: collaborator.id,
        status: ReimbursementStatus.APPROVED,
      });

      const response = await request(app)
        .post(`/reimbursements/${reimbursement.id}/pay`)
        .set('Authorization', await authHeader(Role.FINANCE));

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(ReimbursementStatus.PAID);

      const history = await prisma.reimbursementHistory.findFirst({
        where: {
          action: ReimbursementHistoryAction.PAID,
          reimbursementRequestId: reimbursement.id,
          userId: finance.id,
        },
      });
      expect(history).toBeTruthy();
    });

    it('rejects pay without token with 401', async () => {
      const response = await request(app).post(
        '/reimbursements/00000000-0000-0000-0000-000000000000/pay',
      );

      expect(response.status).toBe(401);
    });

    it('rejects pay with invalid role with 403', async () => {
      const response = await request(app)
        .post('/reimbursements/00000000-0000-0000-0000-000000000000/pay')
        .set('Authorization', await authHeader(Role.MANAGER));

      expect(response.status).toBe(403);
    });

    it('returns 404 when paying nonexistent reimbursement', async () => {
      const response = await request(app)
        .post('/reimbursements/00000000-0000-0000-0000-000000000000/pay')
        .set('Authorization', await authHeader(Role.FINANCE));

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(
        'Solicitação de reembolso não encontrada',
      );
    });

    it('rejects pay when reimbursement is not approved with 400', async () => {
      const category = await createCategory();
      const collaborator = await getSeedUser('colaborador@email.com');
      const reimbursement = await createReimbursementFixture({
        categoryId: category.id,
        requesterId: collaborator.id,
        status: ReimbursementStatus.SUBMITTED,
      });

      const response = await request(app)
        .post(`/reimbursements/${reimbursement.id}/pay`)
        .set('Authorization', await authHeader(Role.FINANCE));

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Transição de status inválida');
    });
  });
});
