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
import { createCategoryFixture, getSeedUser } from '../helpers/factories';

describe('POST /reimbursements', () => {
  beforeEach(async () => {
    await prepareDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('when user is authenticated as COLABORADOR', () => {
    it('creates a reimbursement request', async () => {
      const category = await createCategoryFixture();
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
    });

    it('creates a CREATED history record', async () => {
      const category = await createCategoryFixture();
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

      const history = await prisma.reimbursementHistory.findFirst({
        where: {
          action: ReimbursementHistoryAction.CREATED,
          reimbursementRequestId: response.body.id,
          userId: collaborator.id,
        },
      });
      expect(history).toBeTruthy();
    });

    it('ignores requester and status fields from body', async () => {
      const category = await createCategoryFixture();
      const collaborator = await getSeedUser('colaborador@email.com');
      const admin = await getSeedUser('admin@email.com');

      const response = await request(app)
        .post('/reimbursements')
        .set('Authorization', await authHeader(Role.COLLABORATOR))
        .send({
          amount: 120.75,
          categoryId: category.id,
          description: 'Almoço com cliente',
          expenseDate: '2026-05-01',
          requesterId: admin.id,
          status: ReimbursementStatus.APPROVED,
          userId: admin.id,
        });

      expect(response.status).toBe(201);
      expect(response.body.requesterId).toBe(collaborator.id);
      expect(response.body.status).toBe(ReimbursementStatus.DRAFT);
    });
  });

  describe('validation and business rules', () => {
    it.each([
      ['amount must be greater than zero', { amount: 0 }, 'amount'],
      ['expense date is required', { expenseDate: undefined }, 'expenseDate'],
    ])('returns 400 when %s', async (_case, override, field) => {
      const category = await createCategoryFixture();

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

    it('returns 400 when category does not exist', async () => {
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

    it('returns 400 when category is inactive', async () => {
      const category = await createCategoryFixture({ active: false });

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
  });

  describe('authorization', () => {
    it('returns 401 without token', async () => {
      const category = await createCategoryFixture();

      const response = await request(app).post('/reimbursements').send({
        amount: 120.75,
        categoryId: category.id,
        description: 'Almoço com cliente',
        expenseDate: '2026-05-01',
      });

      expect(response.status).toBe(401);
    });

    it.each([
      ['ADMIN', Role.ADMIN],
      ['MANAGER', Role.MANAGER],
      ['FINANCE', Role.FINANCE],
    ] as const)('returns 403 with %s token', async (_label, role) => {
      const category = await createCategoryFixture();

      const response = await request(app)
        .post('/reimbursements')
        .set('Authorization', await authHeader(role))
        .send({
          amount: 120.75,
          categoryId: category.id,
          description: 'Almoço com cliente',
          expenseDate: '2026-05-01',
        });

      expect(response.status).toBe(403);
    });
  });
});
