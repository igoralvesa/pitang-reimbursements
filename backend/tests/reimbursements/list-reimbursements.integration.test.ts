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
  createPaidReimbursementFixture,
  createRejectedReimbursementFixture,
  createReimbursementFixture,
  createSubmittedReimbursementFixture,
  createUserFixture,
  getSeedUser,
} from '../helpers/factories';

describe('GET /reimbursements', () => {
  beforeEach(async () => {
    await prepareDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('pagination and validation', () => {
    it('returns data and meta', async () => {
      await createDraftReimbursementFixture();

      const response = await request(app)
        .get('/reimbursements')
        .set('Authorization', await authHeader(Role.ADMIN));

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        data: expect.any(Array),
        meta: {
          limit: 10,
          page: 1,
          total: 1,
          totalPages: 1,
        },
      });
    });

    it('uses page and limit to control returned records', async () => {
      const category = await createCategoryFixture({ name: 'Paginação' });
      const first = await createReimbursementFixture({
        categoryId: category.id,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });
      const second = await createReimbursementFixture({
        categoryId: category.id,
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
      });

      const response = await request(app)
        .get('/reimbursements')
        .query({ categoryId: category.id, limit: 1, page: 2 })
        .set('Authorization', await authHeader(Role.ADMIN));

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([
        expect.objectContaining({ id: first.id }),
      ]);
      expect(response.body.data).not.toEqual([
        expect.objectContaining({ id: second.id }),
      ]);
      expect(response.body.meta).toEqual({
        limit: 1,
        page: 2,
        total: 2,
        totalPages: 2,
      });
    });

    it.each([
      ['page', { page: 0 }],
      ['limit', { limit: 0 }],
      ['limit', { limit: 101 }],
      ['sortBy', { sortBy: 'invalid' }],
      ['sortOrder', { sortOrder: 'invalid' }],
    ])('rejects invalid %s query param', async (field, query) => {
      const response = await request(app)
        .get('/reimbursements')
        .query(query)
        .set('Authorization', await authHeader(Role.ADMIN));

      expect(response.status).toBe(400);
      expect(response.body[field]).toBeDefined();
    });
  });

  describe('filters', () => {
    it.each([
      [Role.ADMIN, ReimbursementStatus.DRAFT],
      [Role.MANAGER, ReimbursementStatus.SUBMITTED],
      [Role.FINANCE, ReimbursementStatus.APPROVED],
    ])('filters by collaboratorId as %s', async (role, status) => {
      const category = await createCategoryFixture();
      const collaborator = await getSeedUser(Role.COLLABORATOR);
      const anotherCollaborator = await createUserFixture({
        email: 'outro-colaborador@email.com',
        name: 'Outro Colaborador',
        role: Role.COLLABORATOR,
      });
      const expected = await createReimbursementFixture({
        categoryId: category.id,
        requesterId: collaborator.id,
        status,
      });
      await createReimbursementFixture({
        categoryId: category.id,
        requesterId: anotherCollaborator.id,
        status,
      });

      const response = await request(app)
        .get('/reimbursements')
        .query({ collaboratorId: collaborator.id })
        .set('Authorization', await authHeader(role));

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([
        expect.objectContaining({ id: expected.id, requesterId: collaborator.id }),
      ]);
      expect(response.body.meta.total).toBe(1);
    });

    it('filters by categoryId', async () => {
      const firstCategory = await createCategoryFixture({ name: 'Categoria A' });
      const secondCategory = await createCategoryFixture({ name: 'Categoria B' });
      const expected = await createSubmittedReimbursementFixture({
        categoryId: firstCategory.id,
      });
      await createSubmittedReimbursementFixture({
        categoryId: secondCategory.id,
      });

      const response = await request(app)
        .get('/reimbursements')
        .query({ categoryId: firstCategory.id })
        .set('Authorization', await authHeader(Role.MANAGER));

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([
        expect.objectContaining({ id: expected.id, categoryId: firstCategory.id }),
      ]);
      expect(response.body.meta.total).toBe(1);
    });

    it('filters by status', async () => {
      const approved = await createApprovedReimbursementFixture();
      await createDraftReimbursementFixture();

      const response = await request(app)
        .get('/reimbursements')
        .query({ status: ReimbursementStatus.APPROVED })
        .set('Authorization', await authHeader(Role.ADMIN));

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([
        expect.objectContaining({
          id: approved.id,
          status: ReimbursementStatus.APPROVED,
        }),
      ]);
    });

    it('combines pagination and filters', async () => {
      const category = await createCategoryFixture({ name: 'Filtro combinado' });
      await createApprovedReimbursementFixture({
        categoryId: category.id,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });
      const second = await createApprovedReimbursementFixture({
        categoryId: category.id,
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
      });
      await createSubmittedReimbursementFixture({
        categoryId: category.id,
      });

      const response = await request(app)
        .get('/reimbursements')
        .query({
          categoryId: category.id,
          limit: 1,
          page: 1,
          status: ReimbursementStatus.APPROVED,
        })
        .set('Authorization', await authHeader(Role.ADMIN));

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([
        expect.objectContaining({ id: second.id }),
      ]);
      expect(response.body.meta).toEqual({
        limit: 1,
        page: 1,
        total: 2,
        totalPages: 2,
      });
    });
  });

  describe('collaborator visibility', () => {
    it('sees only own reimbursements', async () => {
      const category = await createCategoryFixture();
      const collaborator = await getSeedUser(Role.COLLABORATOR);
      const admin = await getSeedUser(Role.ADMIN);
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
      expect(response.body.data).toEqual([
        expect.objectContaining({
          id: ownReimbursement.id,
          requesterId: collaborator.id,
        }),
      ]);
    });

    it('rejects collaboratorId query param', async () => {
      const collaborator = await getSeedUser(Role.COLLABORATOR);

      const response = await request(app)
        .get('/reimbursements')
        .query({ collaboratorId: collaborator.id })
        .set('Authorization', await authHeader(Role.COLLABORATOR));

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: 'Colaborador não pode filtrar por outro colaborador',
      });
    });

    it('can filter own reimbursements by categoryId and status', async () => {
      const collaborator = await getSeedUser(Role.COLLABORATOR);
      const category = await createCategoryFixture({ name: 'Categoria própria' });
      const expected = await createSubmittedReimbursementFixture({
        categoryId: category.id,
        requesterId: collaborator.id,
      });
      await createDraftReimbursementFixture({
        categoryId: category.id,
        requesterId: collaborator.id,
      });

      const response = await request(app)
        .get('/reimbursements')
        .query({
          categoryId: category.id,
          status: ReimbursementStatus.SUBMITTED,
        })
        .set('Authorization', await authHeader(Role.COLLABORATOR));

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([
        expect.objectContaining({ id: expected.id }),
      ]);
    });
  });

  describe('manager visibility', () => {
    it('without status sees only submitted, approved, and rejected', async () => {
      await createDraftReimbursementFixture();
      const submitted = await createSubmittedReimbursementFixture();
      const approved = await createApprovedReimbursementFixture();
      const rejected = await createRejectedReimbursementFixture();
      await createPaidReimbursementFixture();

      const response = await request(app)
        .get('/reimbursements')
        .set('Authorization', await authHeader(Role.MANAGER));

      expect(response.status).toBe(200);
      expect(response.body.data.map((item: { id: string }) => item.id)).toEqual(
        expect.arrayContaining([submitted.id, approved.id, rejected.id]),
      );
      expect(response.body.data).toHaveLength(3);
    });

    it.each([
      ReimbursementStatus.SUBMITTED,
      ReimbursementStatus.APPROVED,
      ReimbursementStatus.REJECTED,
    ])('allows status=%s', async (status) => {
      const expected = await createReimbursementFixture({ status });

      const response = await request(app)
        .get('/reimbursements')
        .query({ status })
        .set('Authorization', await authHeader(Role.MANAGER));

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([
        expect.objectContaining({ id: expected.id, status }),
      ]);
    });

    it.each([ReimbursementStatus.DRAFT, ReimbursementStatus.PAID])(
      'rejects forbidden status=%s',
      async (status) => {
        const response = await request(app)
          .get('/reimbursements')
          .query({ status })
          .set('Authorization', await authHeader(Role.MANAGER));

        expect(response.status).toBe(403);
      },
    );
  });

  describe('finance visibility', () => {
    it('without status sees only approved and paid', async () => {
      await createSubmittedReimbursementFixture();
      const approved = await createApprovedReimbursementFixture();
      const paid = await createPaidReimbursementFixture();
      await createRejectedReimbursementFixture();

      const response = await request(app)
        .get('/reimbursements')
        .set('Authorization', await authHeader(Role.FINANCE));

      expect(response.status).toBe(200);
      expect(response.body.data.map((item: { id: string }) => item.id)).toEqual(
        expect.arrayContaining([approved.id, paid.id]),
      );
      expect(response.body.data).toHaveLength(2);
    });

    it.each([ReimbursementStatus.APPROVED, ReimbursementStatus.PAID])(
      'allows status=%s',
      async (status) => {
        const expected = await createReimbursementFixture({ status });

        const response = await request(app)
          .get('/reimbursements')
          .query({ status })
          .set('Authorization', await authHeader(Role.FINANCE));

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([
          expect.objectContaining({ id: expected.id, status }),
        ]);
      },
    );

    it.each([
      ReimbursementStatus.DRAFT,
      ReimbursementStatus.SUBMITTED,
      ReimbursementStatus.REJECTED,
    ])('rejects forbidden status=%s', async (status) => {
      const response = await request(app)
        .get('/reimbursements')
        .query({ status })
        .set('Authorization', await authHeader(Role.FINANCE));

      expect(response.status).toBe(403);
    });
  });

  describe('admin visibility', () => {
    it('can see all statuses', async () => {
      await createDraftReimbursementFixture();
      await createSubmittedReimbursementFixture();
      await createApprovedReimbursementFixture();
      await createRejectedReimbursementFixture();
      await createPaidReimbursementFixture();

      const response = await request(app)
        .get('/reimbursements')
        .set('Authorization', await authHeader(Role.ADMIN));

      expect(response.status).toBe(200);
      expect(response.body.meta.total).toBe(5);
    });

    it.each(Object.values(ReimbursementStatus))(
      'can filter by status=%s',
      async (status) => {
        const expected = await createReimbursementFixture({ status });

        const response = await request(app)
          .get('/reimbursements')
          .query({ status })
          .set('Authorization', await authHeader(Role.ADMIN));

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([
          expect.objectContaining({ id: expected.id, status }),
        ]);
      },
    );
  });

  describe('sorting', () => {
    it('sorts by createdAt desc', async () => {
      const older = await createDraftReimbursementFixture({
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });
      const newer = await createDraftReimbursementFixture({
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
      });

      const response = await request(app)
        .get('/reimbursements')
        .query({ sortBy: 'createdAt', sortOrder: 'desc' })
        .set('Authorization', await authHeader(Role.ADMIN));

      expect(response.status).toBe(200);
      expect(response.body.data.map((item: { id: string }) => item.id)).toEqual([
        newer.id,
        older.id,
      ]);
    });

    it('sorts by expenseDate asc', async () => {
      const first = await createDraftReimbursementFixture({
        expenseDate: new Date('2026-01-01T00:00:00.000Z'),
      });
      const second = await createDraftReimbursementFixture({
        expenseDate: new Date('2026-01-02T00:00:00.000Z'),
      });

      const response = await request(app)
        .get('/reimbursements')
        .query({ sortBy: 'expenseDate', sortOrder: 'asc' })
        .set('Authorization', await authHeader(Role.ADMIN));

      expect(response.status).toBe(200);
      expect(response.body.data.map((item: { id: string }) => item.id)).toEqual([
        first.id,
        second.id,
      ]);
    });

    it('sorts by amount desc', async () => {
      const smaller = await createDraftReimbursementFixture({ amount: 10 });
      const larger = await createDraftReimbursementFixture({ amount: 100 });

      const response = await request(app)
        .get('/reimbursements')
        .query({ sortBy: 'amount', sortOrder: 'desc' })
        .set('Authorization', await authHeader(Role.ADMIN));

      expect(response.status).toBe(200);
      expect(response.body.data.map((item: { id: string }) => item.id)).toEqual([
        larger.id,
        smaller.id,
      ]);
    });
  });

  describe('when user is not authenticated', () => {
    it('returns 401', async () => {
      const response = await request(app).get('/reimbursements');

      expect(response.status).toBe(401);
    });
  });
});
