import { afterAll, beforeEach, describe, expect, it } from '@jest/globals';

import {
  ReimbursementHistoryAction,
  ReimbursementStatus,
} from '../../generated/prisma/client';
import { prisma } from '../../src/core/prisma';
import {
  defaultCategory,
  defaultReimbursement,
  seedDefaultData,
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

  it('creates default users, category, reimbursement and history', async () => {
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

  it('does not duplicate default category or reimbursement when run more than once', async () => {
    await seedDefaultData();
    await seedDefaultData();

    const categories = await prisma.category.findMany({
      where: { name: defaultCategory.name },
    });
    const reimbursements = await prisma.reimbursementRequest.findMany({
      where: { description: defaultReimbursement.description },
    });
    const histories = await prisma.reimbursementHistory.findMany({
      where: { action: ReimbursementHistoryAction.CREATED },
    });

    expect(categories).toHaveLength(1);
    expect(reimbursements).toHaveLength(1);
    expect(histories).toHaveLength(1);
  });
});
