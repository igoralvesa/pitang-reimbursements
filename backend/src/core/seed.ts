import bcrypt from 'bcryptjs';

import {
  ReimbursementHistoryAction,
  ReimbursementStatus,
} from '../../generated/prisma/client';
import { logger } from './Logger';
import { prisma } from './prisma';
import { Role } from '../types/roles-enum';

const seedUsers = [
  {
    email: 'admin@email.com',
    name: 'Admin',
    role: Role.ADMIN,
  },
  {
    email: 'colaborador@email.com',
    name: 'Colaborador',
    role: Role.COLLABORATOR,
  },
  {
    email: 'gestor@email.com',
    name: 'Gestor',
    role: Role.MANAGER,
  },
  {
    email: 'financeiro@email.com',
    name: 'Financeiro',
    role: Role.FINANCE,
  },
] as const;

const defaultPassword = 'Senha@123';
const defaultCategory = {
  active: true,
  name: 'Transporte',
} as const;

const defaultReimbursement = {
  amount: 50,
  description: 'Táxi para reunião com cliente',
  expenseDate: new Date('2026-05-01T00:00:00.000Z'),
  historyObservation: 'Solicitação padrão criada pelo seed',
  status: ReimbursementStatus.DRAFT,
} as const;

export async function seedDefaultUsers() {
  const passwordHash = bcrypt.hashSync(defaultPassword, 10);

  await Promise.all(
    seedUsers.map((user) =>
      prisma.user.upsert({
        create: {
          ...user,
          passwordHash,
        },
        update: {
          name: user.name,
          role: user.role,
        },
        where: {
          email: user.email,
        },
      }),
    ),
  );

  logger.info(
    { users: seedUsers.map(({ email, role }) => ({ email, role })) },
    'Seed users ready',
  );
}

export async function seedDefaultData() {
  await seedDefaultUsers();

  const collaborator = await prisma.user.findUniqueOrThrow({
    where: { email: 'colaborador@email.com' },
  });

  const existingCategory = await prisma.category.findFirst({
    where: { name: defaultCategory.name },
  });

  const category = existingCategory
    ? await prisma.category.update({
        data: { active: defaultCategory.active },
        where: { id: existingCategory.id },
      })
    : await prisma.category.create({
        data: defaultCategory,
      });

  const existingReimbursement = await prisma.reimbursementRequest.findFirst({
    where: {
      categoryId: category.id,
      description: defaultReimbursement.description,
      requesterId: collaborator.id,
    },
  });

  const reimbursement =
    existingReimbursement ??
    (await prisma.reimbursementRequest.create({
      data: {
        amount: defaultReimbursement.amount,
        categoryId: category.id,
        description: defaultReimbursement.description,
        expenseDate: defaultReimbursement.expenseDate,
        histories: {
          create: {
            action: ReimbursementHistoryAction.CREATED,
            observation: defaultReimbursement.historyObservation,
            userId: collaborator.id,
          },
        },
        requesterId: collaborator.id,
        status: defaultReimbursement.status,
      },
    }));

  logger.info(
    {
      categoryId: category.id,
      reimbursementId: reimbursement.id,
      requesterId: collaborator.id,
    },
    'Seed default category and reimbursement ready',
  );
}

export { defaultCategory, defaultPassword, defaultReimbursement, seedUsers };
