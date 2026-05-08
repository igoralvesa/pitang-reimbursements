import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';

import {
  ReimbursementHistoryAction,
  ReimbursementStatus,
} from '../../generated/prisma/client';
import { prisma } from '../../src/core/prisma';
import {
  defaultCategory,
  defaultReimbursement,
  seedCategories,
  seedDefaultData,
  seedReimbursements,
} from '../../src/core/seed';
import { Role } from '../../src/types/roles-enum';
import { cleanDatabase, disconnectDatabase } from '../helpers/database';

describe('Seed data', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it('creates default users, categories, reimbursements and history without attachments', async () => {
    await seedDefaultData();

    const collaborator = await prisma.user.findUnique({
      where: { email: 'colaborador@email.com' },
    });
    const category = await prisma.category.findFirst({
      where: { name: defaultCategory.name },
    });

    expect(collaborator).toMatchObject({
      email: 'colaborador@email.com',
      role: Role.COLLABORATOR,
    });
    expect(category).toMatchObject(defaultCategory);

    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      where: {
        name: {
          in: seedCategories.map((seedCategory) => seedCategory.name),
        },
      },
    });

    expect(categories).toHaveLength(seedCategories.length);
    expect(categories).toEqual(
      expect.arrayContaining(
        seedCategories.map((seedCategory) =>
          expect.objectContaining(seedCategory),
        ),
      ),
    );

    const reimbursement = await prisma.reimbursementRequest.findFirst({
      where: {
        categoryId: category!.id,
        description: defaultReimbursement.description,
        requesterId: collaborator!.id,
      },
    });

    expect(reimbursement).toMatchObject({
      categoryId: category!.id,
      description: defaultReimbursement.description,
      requesterId: collaborator!.id,
      status: ReimbursementStatus.DRAFT,
    });

    const reimbursements = await prisma.reimbursementRequest.findMany({
      where: {
        description: {
          in: seedReimbursements.map(
            (seedReimbursement) => seedReimbursement.description,
          ),
        },
        requesterId: collaborator!.id,
      },
    });

    expect(reimbursements).toHaveLength(seedReimbursements.length);
    expect(reimbursements).toEqual(
      expect.arrayContaining(
        seedReimbursements.map((seedReimbursement) =>
          expect.objectContaining({
            description: seedReimbursement.description,
            rejectionReason: seedReimbursement.rejectionReason,
            status: seedReimbursement.status,
          }),
        ),
      ),
    );

    const attachments = await prisma.attachment.findMany({
      where: {
        reimbursementRequestId: {
          in: reimbursements.map((seededReimbursement) => seededReimbursement.id),
        },
      },
    });

    expect(attachments).toHaveLength(0);

    const history = await prisma.reimbursementHistory.findFirst({
      where: {
        action: ReimbursementHistoryAction.CREATED,
        reimbursementRequestId: reimbursement!.id,
        userId: collaborator!.id,
      },
    });

    expect(history).toMatchObject({
      observation: defaultReimbursement.historyObservation,
    });
  });

  it('does not duplicate default categories or reimbursements when run more than once', async () => {
    await seedDefaultData();
    await seedDefaultData();

    const categories = await prisma.category.findMany({
      where: { name: defaultCategory.name },
    });
    const reimbursements = await prisma.reimbursementRequest.findMany({
      where: {
        description: {
          in: seedReimbursements.map(
            (seedReimbursement) => seedReimbursement.description,
          ),
        },
      },
    });
    const histories = await prisma.reimbursementHistory.findMany({
      where: { action: ReimbursementHistoryAction.CREATED },
    });
    const seededCategories = await prisma.category.findMany({
      where: {
        name: {
          in: seedCategories.map((seedCategory) => seedCategory.name),
        },
      },
    });

    expect(categories).toHaveLength(1);
    expect(seededCategories).toHaveLength(seedCategories.length);
    expect(reimbursements).toHaveLength(seedReimbursements.length);
    expect(histories).toHaveLength(seedReimbursements.length);
  });
});
